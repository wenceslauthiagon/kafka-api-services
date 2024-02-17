import { Logger } from 'winston';
import { Controller, Body, Put } from '@nestjs/common';
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
  DeclineWalletInvitationRequest,
  DeclineWalletInvitationResponse,
} from '@zro/operations/interface';
import { DeclineWalletInvitationServiceKafka } from '@zro/operations/infrastructure';

class DeclineWalletInvitationBody {
  @ApiProperty({
    description: 'Wallet invitation UUID.',
  })
  @IsUUID(4)
  invite_id!: string;
}

class DeclineWalletInvitationRestResponse {
  @ApiProperty({
    description: 'Wallet invitation UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Wallet invitation contact.',
    example: '+5581999990000',
  })
  contact_information: string;

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

  constructor(props: DeclineWalletInvitationResponse) {
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
@Controller('operations/wallet-invitations/decline')
@ApiBearerAuth()
@DefaultApiHeaders()
@EnableReplayProtection()
@HasPermission('api-users-put-operations-wallet-invitations-decline')
export class DeclineWalletInvitationRestController {
  /**
   * Send wallet invitation endpoint.
   */
  @ApiOperation({
    summary: 'Decline a Wallet invitation.',
    description: 'Decline an invitation.',
  })
  @ApiCreatedResponse({
    description: 'Wallet invitation response.',
    type: DeclineWalletInvitationRestResponse,
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
    @Body() body: DeclineWalletInvitationBody,
    @KafkaServiceParam(DeclineWalletInvitationServiceKafka)
    service: DeclineWalletInvitationServiceKafka,
    @LoggerParam(DeclineWalletInvitationRestController)
    logger: Logger,
  ): Promise<DeclineWalletInvitationRestResponse> {
    // Send a payload.
    const payload: DeclineWalletInvitationRequest = {
      id: body.invite_id,
      email: user.email,
    };

    logger.debug('Decline wallet invitation.', { user, payload });

    // Call send wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet invitation declined.', { result });

    const response = new DeclineWalletInvitationRestResponse(result);

    return response;
  }
}
