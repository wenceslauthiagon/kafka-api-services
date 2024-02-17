import { Logger } from 'winston';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
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
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { DeleteUserWalletRequest } from '@zro/operations/interface';
import {
  AuthWalletParam,
  DeleteUserWalletServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class DeleteUserWalletByWalletAndUserParams {
  @ApiProperty({
    description: 'User ID.',
  })
  @IsUUID(4)
  id: string;
}

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Permissions')
@Controller('operations/permissions/by-user/:id')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@EnableReplayProtection()
@HasPermission(
  'api-users-delete-operations-permissions-by-wallet-id-and-user-id',
)
export class DeleteUserWalletByWalletAndUserRestController {
  /**
   * delete user wallet endpoint.
   */
  @ApiOperation({
    summary: 'Delete a permission from the user who owns a wallet.',
    description:
      "To delete permission from the user who owns a wallet. Only the root user can delete another user's permission.",
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
    @Param() params: DeleteUserWalletByWalletAndUserParams,
    @KafkaServiceParam(DeleteUserWalletServiceKafka)
    service: DeleteUserWalletServiceKafka,
    @LoggerParam(DeleteUserWalletByWalletAndUserRestController)
    logger: Logger,
  ): Promise<void> {
    // DeleteUserWallet payload.
    const payload: DeleteUserWalletRequest = {
      ownerWalletId: user.uuid,
      userId: params.id,
      walletId: wallet.id,
    };

    logger.debug('Delete user wallet.', { user, payload });

    // Call delete user wallet service.
    const result = await service.execute(payload);

    logger.debug('User wallet deleted.', { result });
  }
}
