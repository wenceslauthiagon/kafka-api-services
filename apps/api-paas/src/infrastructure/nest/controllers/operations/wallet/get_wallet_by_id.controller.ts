import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { WalletState } from '@zro/operations/domain';
import {
  GetUserWalletByUserAndWalletResponse,
  GetUserWalletByUserAndWalletRequest,
} from '@zro/operations/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetUserWalletByUserAndWalletServiceKafka } from '@zro/operations/infrastructure';

class GetWalletByIdParams {
  @ApiProperty({
    description: 'Wallet id.',
  })
  @IsUUID(4)
  id: string;
}

class GetWalletByIdRestResponse {
  @ApiProperty({
    description: 'Wallet id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet name.',
    example: 'BTC',
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
    description: 'Wallet permission type that defines what the user can do.',
    example: ['CLIENT'],
  })
  permission_types: string[];

  @ApiProperty({
    description: 'Wallet owner id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  owner_id: string;

  @ApiProperty({
    description: 'Wallet owner name.',
    example: 'James Bond',
  })
  owner_name: string;

  @ApiProperty({
    description: 'Wallet created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetUserWalletByUserAndWalletResponse) {
    this.id = props.wallet.uuid;
    this.name = props.wallet.name;
    this.default = props.wallet.default;
    this.state = props.wallet.state;
    this.permission_types = props.permissionTypeTags;
    this.owner_id = props.wallet.userId;
    this.owner_name = props.wallet.userName;
    this.created_at = props.wallet.createdAt;
  }
}

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallets')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('operations/wallets/:id')
@HasPermission('api-paas-get-operations-wallets-by-id')
export class GetWalletByIdRestController {
  /**
   * get wallet by id endpoint.
   */
  @ApiOperation({
    summary: 'Get wallet by ID.',
    description:
      "Enter the wallet's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'The wallet returned successfully.',
    type: GetWalletByIdRestResponse,
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
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: GetWalletByIdParams,
    @KafkaServiceParam(GetUserWalletByUserAndWalletServiceKafka)
    getWalletService: GetUserWalletByUserAndWalletServiceKafka,
    @LoggerParam(GetWalletByIdRestController)
    logger: Logger,
  ): Promise<GetWalletByIdRestResponse> {
    // GetAll payload.
    const payload: GetUserWalletByUserAndWalletRequest = {
      walletId: params.id,
      userId: user.uuid,
    };

    logger.debug('Get wallet by id.', { user, payload });

    // Call get wallet by id service.
    const result = await getWalletService.execute(payload);

    logger.debug('Wallet found.', { result });

    const response = result && new GetWalletByIdRestResponse(result);

    return response;
  }
}
