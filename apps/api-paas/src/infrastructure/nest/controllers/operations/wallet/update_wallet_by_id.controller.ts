import { Logger } from 'winston';
import { Body, Controller, Param, Put } from '@nestjs/common';
import { IsString, IsUUID, Length } from 'class-validator';
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
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { WalletState } from '@zro/operations/domain';
import {
  UpdateWalletByUuidAndUserResponse,
  UpdateWalletByUuidAndUserRequest,
} from '@zro/operations/interface';
import { UpdateWalletByUuidAndUserServiceKafka } from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class UpdateWalletByIdParams {
  @ApiProperty({
    description: 'Wallet id.',
  })
  @IsUUID(4)
  id!: string;
}

class UpdateWalletBody {
  @ApiProperty({
    description: 'Wallet name.',
    example: 'Default wallet',
  })
  @IsString()
  @Length(1, 255)
  name!: string;
}

class UpdateWalletRestResponse {
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

  constructor(props: UpdateWalletByUuidAndUserResponse) {
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
@EnableReplayProtection()
@Controller('operations/wallets/:id')
@HasPermission('api-paas-put-operations-wallets-by-id')
export class UpdateWalletRestController {
  /**
   * update wallet by id endpoint.
   */
  @ApiOperation({
    summary: 'Update a wallet data.',
    description: 'To update a wallet name with new one.',
  })
  @ApiOkResponse({
    description: 'The wallet updated successfully.',
    type: UpdateWalletRestResponse,
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
  @Put()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: UpdateWalletByIdParams,
    @Body() body: UpdateWalletBody,
    @KafkaServiceParam(UpdateWalletByUuidAndUserServiceKafka)
    service: UpdateWalletByUuidAndUserServiceKafka,
    @LoggerParam(UpdateWalletRestController)
    logger: Logger,
  ): Promise<UpdateWalletRestResponse> {
    // UpdateWallet payload.
    const payload: UpdateWalletByUuidAndUserRequest = {
      uuid: params.id,
      userId: user.uuid,
      name: body.name,
    };

    logger.debug('Update new wallet.', { user, payload });

    // Call update wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet updated.', { result });

    const response = new UpdateWalletRestResponse(result);

    return response;
  }
}
