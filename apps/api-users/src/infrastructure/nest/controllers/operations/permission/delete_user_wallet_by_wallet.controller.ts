import { Logger } from 'winston';
import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import {
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
import { AuthWallet } from '@zro/operations/domain';
import { DeleteUserWalletByUserAndWalletRequest } from '@zro/operations/interface';
import {
  AuthWalletParam,
  DeleteUserWalletByUserAndWalletServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Permissions')
@Controller('operations/permissions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@EnableReplayProtection()
@HasPermission('api-users-delete-operations-permissions-by-wallet-id')
export class DeleteUserWalletByWalletRestController {
  /**
   * delete user wallet endpoint.
   */
  @ApiOperation({
    summary: 'Delete a permission that the logged in user can access.',
    description: 'To delete permission that the logged in user can access.',
  })
  @ApiOkResponse({
    description: 'The wallet permission deleted successfully.',
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
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @KafkaServiceParam(DeleteUserWalletByUserAndWalletServiceKafka)
    service: DeleteUserWalletByUserAndWalletServiceKafka,
    @LoggerParam(DeleteUserWalletByWalletRestController)
    logger: Logger,
  ): Promise<void> {
    // DeleteUserWallet payload.
    const payload: DeleteUserWalletByUserAndWalletRequest = {
      userId: user.uuid,
      walletId: wallet.id,
    };

    logger.debug('Delete user wallet.', { user, payload });

    // Call delete user wallet service.
    const result = await service.execute(payload);

    logger.debug('User wallet deleted.', { result });
  }
}
