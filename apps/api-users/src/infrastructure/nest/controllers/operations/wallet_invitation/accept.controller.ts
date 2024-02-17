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
import { IsString, IsUUID } from 'class-validator';
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
import { AcceptWalletInvitationServiceKafka } from '@zro/operations/infrastructure';
import {
  AcceptWalletInvitationRequest,
  AcceptWalletInvitationResponse,
} from '@zro/operations/interface';

class AcceptWalletInvitationBody {
  @ApiProperty({
    description: 'Wallet invitation UUID.',
  })
  @IsUUID(4)
  invite_id!: string;

  @ApiProperty({
    description: 'Wallet invitation code sent by email or sms.',
    example: '91876',
  })
  @IsString()
  invite_code!: string;
}

class AcceptWalletInvitationRestResponse {
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

  constructor(props: AcceptWalletInvitationResponse) {
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
@Controller('operations/wallet-invitations/accept')
@ApiBearerAuth()
@DefaultApiHeaders()
@EnableReplayProtection()
@HasPermission('api-users-put-operations-wallet-invitations-accept')
export class AcceptWalletInvitationRestController {
  /**
   * Send wallet invitation endpoint.
   */
  @ApiOperation({
    summary: 'Accept a Wallet invitation.',
    description: 'Accept an invitation.',
  })
  @ApiCreatedResponse({
    description: 'Wallet invitation response.',
    type: AcceptWalletInvitationRestResponse,
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
    @Body() body: AcceptWalletInvitationBody,
    @KafkaServiceParam(AcceptWalletInvitationServiceKafka)
    service: AcceptWalletInvitationServiceKafka,
    @LoggerParam(AcceptWalletInvitationRestController)
    logger: Logger,
  ): Promise<AcceptWalletInvitationRestResponse> {
    // Send a payload.
    const payload: AcceptWalletInvitationRequest = {
      id: body.invite_id,
      confirmCode: body.invite_code,
      userId: user.uuid,
      email: user.email,
    };

    logger.debug('Accept wallet invitation.', { user, payload });

    // Call send wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet invitation accepted.', { result });

    const response = new AcceptWalletInvitationRestResponse(result);

    return response;
  }
}
