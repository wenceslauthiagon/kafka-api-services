import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
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
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  DefaultApiHeaders,
  IsIsoStringDateFormat,
  IsDateAfterThan,
  IsDateBeforeThan,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { WalletInvitationState } from '@zro/operations/domain';
import {
  GetAllWalletInvitationByUserResponseItem,
  GetAllWalletInvitationByUserResponse,
  GetAllWalletInvitationByUserRequest,
  GetAllWalletInvitationByUserRequestSort,
} from '@zro/operations/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllWalletInvitationByUserServiceKafka } from '@zro/operations/infrastructure';

class GetAllWalletInvitationByUserParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllWalletInvitationByUserRequestSort,
  })
  @IsOptional()
  @Sort(GetAllWalletInvitationByUserRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'State for wallet invitation.',
  })
  @IsOptional()
  @IsEnum(WalletInvitationState)
  state: WalletInvitationState;

  @ApiPropertyOptional({
    description: 'Confirmed period date start for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('accepted_at_period_end', false)
  accepted_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Confirmed period date end for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('accepted_at_period_start', false)
  accepted_at_period_end?: Date;

  @ApiPropertyOptional({
    description: 'Declined period date start for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('declined_at_period_end', false)
  declined_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Declined period date end for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('declined_at_period_start', false)
  declined_at_period_end?: Date;

  @ApiPropertyOptional({
    description: 'Expired period date start for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('expired_at_period_end', false)
  expired_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Expired period date end for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('expired_at_period_start', false)
  expired_at_period_end?: Date;

  @ApiPropertyOptional({
    description: 'Created period date start for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('created_at_period_end', false)
  created_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Created period date end for any invite.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('created_at_period_start', false)
  created_at_period_end?: Date;
}

class GetAllWalletInvitationByUserRestResponseItem {
  @ApiProperty({
    description: 'The Id invitation.',
    example: '612b77e1-5b93-4985-bfc2-6b8f3f09b58a',
  })
  id: string;

  @ApiProperty({
    description: 'The state invitation.',
    enum: WalletInvitationState,
    example: WalletInvitationState.ACCEPTED,
  })
  state: WalletInvitationState;

  @ApiProperty({
    description: 'The contact information email for invitation.',
    example: 'teste@zrobank.com.br',
  })
  email: string;

  @ApiProperty({
    description: 'The wallet id request in invitation.',
    example: '7387c066-5702-4516-b358-8c4b31bab783',
  })
  wallet_id: string;

  @ApiProperty({
    description: 'Wallet permission type that defines what the user can do.',
    example: ['CLIENT'],
  })
  permission_types: string[];

  @ApiProperty({
    description: 'Wallet Invitation created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Wallet Invitation updated at.',
    example: new Date(),
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Wallet Invitation expired at.',
    example: new Date(),
  })
  expired_at: Date;

  @ApiProperty({
    description: 'Wallet Invitation accepted at.',
    example: new Date(),
  })
  accepted_at: Date;

  @ApiProperty({
    description: 'Wallet Invitation declined at.',
    example: new Date(),
  })
  declined_at: Date;

  constructor(props: GetAllWalletInvitationByUserResponseItem) {
    this.id = props.id;
    this.state = props.state;
    this.email = props.email;
    this.wallet_id = props.walletId;
    this.permission_types = props.permissionTypeTags;
    this.accepted_at = props.acceptedAt;
    this.declined_at = props.declinedAt;
    this.expired_at = props.expiredAt;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

class GetAllWalletInvitationByUserRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'WalletInvitations data.',
    type: [GetAllWalletInvitationByUserRestResponseItem],
  })
  data!: GetAllWalletInvitationByUserRestResponseItem[];

  constructor(props: GetAllWalletInvitationByUserResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllWalletInvitationByUserRestResponseItem(item),
    );
  }
}

/**
 * WalletInvitation by user controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallet Invitations')
@Controller('operations/wallet-invitations/user')
@DefaultApiHeaders()
@ApiBearerAuth()
@HasPermission('api-users-get-operations-wallet-invitations-user')
export class GetAllWalletInvitationByUserRestController {
  /**
   * get walletInvitations endpoint.
   */
  @ApiOperation({
    summary: "List user's sent wallet invitations.",
    description:
      "Get a list of user's sent wallet invitations. You can include any of the filter parameters below to refine your search.",
  })
  @ApiOkResponse({
    description: 'The wallet invitations returned successfully.',
    type: GetAllWalletInvitationByUserRestResponse,
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
    @Query() query: GetAllWalletInvitationByUserParams,
    @KafkaServiceParam(GetAllWalletInvitationByUserServiceKafka)
    getAllWalletInvitationByUserService: GetAllWalletInvitationByUserServiceKafka,
    @LoggerParam(GetAllWalletInvitationByUserRestController)
    logger: Logger,
  ): Promise<GetAllWalletInvitationByUserRestResponse> {
    // GetAll payload.
    const payload: GetAllWalletInvitationByUserRequest = {
      userId: user.uuid,
      state: query.state,
      acceptedAtPeriodStart: query.accepted_at_period_start,
      acceptedAtPeriodEnd: query.accepted_at_period_end,
      declinedAtPeriodStart: query.declined_at_period_start,
      declinedAtPeriodEnd: query.declined_at_period_end,
      expiredAtPeriodStart: query.expired_at_period_start,
      expiredAtPeriodEnd: query.expired_at_period_end,
      createdAtPeriodStart: query.created_at_period_start,
      createdAtPeriodEnd: query.created_at_period_end,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll walletAccounts.', { user, payload });

    // Call get all walletAccount service.
    const result = await getAllWalletInvitationByUserService.execute(payload);

    logger.debug('WalletInvitationByUsers found.', { result });

    const response = new GetAllWalletInvitationByUserRestResponse(result);

    return response;
  }
}
