import { Logger } from 'winston';
import { Body, Controller, Post } from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { WalletState } from '@zro/operations/domain';
import {
  CreateActiveWalletResponse,
  CreateActiveWalletRequest,
} from '@zro/operations/interface';
import { CreateActiveWalletServiceKafka } from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class CreateWalletParams {
  @ApiProperty({
    description: 'Wallet name.',
    example: 'Default wallet',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name: string;
}

class CreateWalletRestResponse {
  @ApiProperty({
    description: 'Wallet id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet name.',
    example: 'Default wallet',
  })
  name: string;

  @ApiProperty({
    description: 'Wallet default flag.',
    example: false,
  })
  default: boolean;

  @ApiProperty({
    description: 'Wallet state.',
    enum: WalletState,
    example: WalletState.ACTIVE,
  })
  state: WalletState;

  @ApiProperty({
    description: 'Wallet created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: CreateActiveWalletResponse) {
    this.id = props.uuid;
    this.name = props.name;
    this.default = props.default;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallets')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@EnableReplayProtection()
@Controller('operations/wallets')
@HasPermission('api-paas-post-operations-wallets')
export class CreateWalletRestController {
  /**
   * create wallet endpoint.
   */
  @ApiOperation({
    summary: 'Create a new wallet.',
    description: 'To create a new wallet with optional wallet name.',
  })
  @ApiCreatedResponse({
    description: 'The wallet created successfully.',
    type: CreateWalletRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Body() body: CreateWalletParams,
    @KafkaServiceParam(CreateActiveWalletServiceKafka)
    service: CreateActiveWalletServiceKafka,
    @LoggerParam(CreateWalletRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreateWalletRestResponse> {
    // CreateWallet payload.
    const payload: CreateActiveWalletRequest = {
      uuid: transactionId,
      userId: user.id,
      userUuid: user.uuid,
      name: body.name,
    };

    logger.debug('Create a new wallet.', { user, payload });

    // Call create wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet created.', { result });

    const response = new CreateWalletRestResponse(result);

    return response;
  }
}
