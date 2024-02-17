import { Logger } from 'winston';
import { Controller, Body, Post, UseGuards } from '@nestjs/common';
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
  IsUUID,
  IsEmail,
  ArrayUnique,
  ArrayMaxSize,
  ArrayMinSize,
  IsString,
} from 'class-validator';
import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { WalletInvitationState } from '@zro/operations/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CreateWalletInvitationRequest,
  CreateWalletInvitationResponse,
} from '@zro/operations/interface';
import { PinBody, PinGuard } from '@zro/api-users/infrastructure';
import { CreateWalletInvitationServiceKafka } from '@zro/operations/infrastructure';

class CreateWalletInvitationBody extends PinBody {
  @ApiProperty({
    description: 'Invited Wallet UUID.',
  })
  @IsUUID(4)
  wallet_id!: string;

  @ApiProperty({
    description: 'The contact information email for invitation.',
    example: 'teste@zrobank.com.br',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Wallet permission type that defines what the user can do. <b>No possible to set ROOT permission.</b>',
    example: ['CLIENT'],
  })
  @ArrayUnique()
  @ArrayMaxSize(16)
  @ArrayMinSize(1)
  @IsString({ each: true })
  permission_types!: string[];
}

class CreateWalletInvitationRestResponse {
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

  constructor(props: CreateWalletInvitationResponse) {
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
@Controller('operations/wallet-invitations')
@ApiBearerAuth()
@DefaultApiHeaders()
@UseGuards(PinGuard)
@TransactionApiHeader()
@HasPermission('api-users-post-operations-wallet-invitations')
export class CreateWalletInvitationRestController {
  /**
   * Send wallet invitation endpoint.
   */
  @ApiOperation({
    summary: 'Create new wallet invitation.',
    description:
      "To create a new wallet invitation, fill on the requisition body below: your pin; the Wallet's ID you want to grant access; the contact information (email) of who will receive the invitation.",
  })
  @ApiCreatedResponse({
    description: 'Wallet invitation response.',
    type: CreateWalletInvitationRestResponse,
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
    @Body() body: CreateWalletInvitationBody,
    @KafkaServiceParam(CreateWalletInvitationServiceKafka)
    service: CreateWalletInvitationServiceKafka,
    @LoggerParam(CreateWalletInvitationRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreateWalletInvitationRestResponse> {
    // Send a payload.
    const payload: CreateWalletInvitationRequest = {
      id: transactionId,
      walletId: body.wallet_id,
      email: body.email,
      userId: user.uuid,
      permissionTypeTags: body.permission_types,
    };

    logger.debug('Send wallet invitation.', { user, payload });

    // Call send wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet invitation created.', { result });

    const response = new CreateWalletInvitationRestResponse(result);

    return response;
  }
}
