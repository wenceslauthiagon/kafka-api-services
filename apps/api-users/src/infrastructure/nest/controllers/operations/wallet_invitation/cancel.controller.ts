import { Logger } from 'winston';
import { Controller, Delete, Param } from '@nestjs/common';
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
import { IsUUID } from 'class-validator';
import {
  DefaultApiHeaders,
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { WalletInvitationState } from '@zro/operations/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CancelWalletInvitationRequest,
  CancelWalletInvitationResponse,
} from '@zro/operations/interface';
import { CancelWalletInvitationServiceKafka } from '@zro/operations/infrastructure';

class CancelWalletInvitationParams {
  @ApiProperty({
    description: 'Wallet invitation UUID.',
  })
  @IsUUID(4)
  id!: string;
}

class CancelWalletInvitationRestResponse {
  @ApiProperty({
    description: 'Wallet invitation UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'The contact information email for invitation.',
    example: 'teste@zrobank.com.br',
  })
  email: string;

  @ApiProperty({
    description: 'Wallet invitation state.',
    example: WalletInvitationState.PENDING,
    enum: WalletInvitationState,
  })
  state: WalletInvitationState;

  @ApiProperty({
    description: 'Wallet UUID.',
  })
  wallet_id: string;

  @ApiProperty({
    description: 'Wallet permission type that defines what the user can do.',
    example: ['CLIENT'],
  })
  permission_types: string[];

  @ApiProperty({
    description: 'Wallet invitation created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Wallet invitation expired at.',
    example: new Date(),
  })
  expired_at: Date;

  constructor(props: CancelWalletInvitationResponse) {
    this.id = props.id;
    this.email = props.email;
    this.state = props.state;
    this.wallet_id = props.walletId;
    this.permission_types = props.permissionTypeTags;
    this.created_at = props.createdAt;
    this.expired_at = props.expiredAt;
  }
}

/**
 * User operations controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallet Invitations')
@Controller('operations/wallet-invitations/:id')
@ApiBearerAuth()
@DefaultApiHeaders()
@EnableReplayProtection()
@HasPermission('api-users-delete-operations-wallet-invitations-by-id')
export class CancelWalletInvitationRestController {
  /**
   * Send wallet invitation endpoint.
   */
  @ApiOperation({
    summary: 'Cancel a Wallet invitation.',
    description: 'Cancel an invitation.',
  })
  @ApiCreatedResponse({
    description: 'Wallet invitation response.',
    type: CancelWalletInvitationRestResponse,
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
    @Param() params: CancelWalletInvitationParams,
    @KafkaServiceParam(CancelWalletInvitationServiceKafka)
    service: CancelWalletInvitationServiceKafka,
    @LoggerParam(CancelWalletInvitationRestController)
    logger: Logger,
  ): Promise<CancelWalletInvitationRestResponse> {
    // Send a payload.
    const payload: CancelWalletInvitationRequest = {
      id: params.id,
      userId: user.uuid,
    };

    logger.debug('Cancel wallet invitation.', { user, payload });

    // Call send wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet invitation canceled.', { result });

    const response = new CancelWalletInvitationRestResponse(result);

    return response;
  }
}
