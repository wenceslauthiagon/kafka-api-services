import { Logger } from 'winston';
import { Body, Controller, Delete, Param } from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { DeleteWalletByUuidAndUserRequest } from '@zro/operations/interface';
import { DeleteWalletByUuidAndUserServiceKafka } from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class DeleteWalletByIdParams {
  @ApiProperty({
    description: 'Wallet id.',
  })
  @IsUUID(4)
  id!: string;
}

class DeleteWalletByIdBody {
  @ApiPropertyOptional({
    description:
      'Wallet backup id. If the wallet to delete has balance, have to pass a wallet backup id to transfer the balance.',
  })
  @IsOptional()
  @IsUUID(4)
  wallet_backup_id: string;
}

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallets')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('operations/wallets/:id')
@HasPermission('api-paas-delete-operations-wallets-by-id')
export class DeleteWalletRestController {
  /**
   * delete wallet by id endpoint.
   */
  @ApiOperation({
    summary: 'Delete a wallet.',
    description: 'To delete a wallet.',
  })
  @ApiOkResponse({
    description: 'The wallet deleted successfully.',
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
  @Delete()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: DeleteWalletByIdParams,
    @Body() body: DeleteWalletByIdBody,
    @KafkaServiceParam(DeleteWalletByUuidAndUserServiceKafka)
    service: DeleteWalletByUuidAndUserServiceKafka,
    @LoggerParam(DeleteWalletRestController)
    logger: Logger,
  ): Promise<void> {
    // DeleteWallet payload.
    const payload: DeleteWalletByUuidAndUserRequest = {
      uuid: params.id,
      userId: user.uuid,
      walletBackupId: body.wallet_backup_id,
    };

    logger.debug('Delete wallet.', { user, payload });

    // Call delete wallet service.
    await service.execute(payload);

    logger.debug('Wallet deleted.');
  }
}
