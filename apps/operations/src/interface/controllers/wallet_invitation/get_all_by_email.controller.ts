import { Logger } from 'winston';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  Pagination,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  Sort,
  PaginationSort,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
} from '@zro/common';
import {
  TGetWalletInvitationsFilter,
  WalletInvitation,
  WalletInvitationState,
  Wallet,
  WalletInvitationRepository,
  PermissionType,
} from '@zro/operations/domain';
import { GetAllWalletInvitationByEmailUseCase as UseCase } from '@zro/operations/application';

export enum GetAllWalletInvitationByEmailRequestSort {
  STATE = 'state',
  CREATED_AT = 'created_at',
}

type PermissionTypeTag = PermissionType['tag'];
type TGetAllWalletInvitationByEmailRequest = Pagination &
  TGetWalletInvitationsFilter &
  Pick<WalletInvitation, 'email'>;

export class GetAllWalletInvitationByEmailRequest
  extends PaginationRequest
  implements TGetAllWalletInvitationByEmailRequest
{
  @IsOptional()
  @Sort(GetAllWalletInvitationByEmailRequestSort)
  sort?: PaginationSort;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(WalletInvitationState)
  state?: WalletInvitationState;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date acceptedAtPeriodStart',
  })
  @IsDateBeforeThan('acceptedAtPeriodEnd', false, {
    message: 'acceptedAtPeriodStart must be before than acceptedAtPeriodEnd',
  })
  acceptedAtPeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date acceptedAtPeriodEnd',
  })
  @IsDateAfterThan('acceptedAtPeriodStart', false, {
    message: 'acceptedAtPeriodEnd must be after than acceptedAtPeriodStart',
  })
  acceptedAtPeriodEnd?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date declinedAtPeriodStart',
  })
  @IsDateBeforeThan('declinedAtPeriodEnd', false, {
    message: 'declinedAtPeriodStart must be before than declinedAtPeriodEnd',
  })
  declinedAtPeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date declinedAtPeriodEnd',
  })
  @IsDateAfterThan('declinedAtPeriodStart', false, {
    message: 'declinedAtPeriodEnd must be after than declinedAtPeriodStart',
  })
  declinedAtPeriodEnd?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtPeriodStart',
  })
  @IsDateBeforeThan('createdAtPeriodEnd', false, {
    message: 'createdAtPeriodStart must be before than createdAtPeriodEnd',
  })
  createdAtPeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtPeriodEnd',
  })
  @IsDateAfterThan('createdAtPeriodStart', false, {
    message: 'createdAtPeriodEnd must be after than createdAtPeriodStart',
  })
  createdAtPeriodEnd?: Date;

  constructor(props: TGetAllWalletInvitationByEmailRequest) {
    super(props);
  }
}

type TGetAllWalletInvitationByEmailResponseItem = Pick<
  WalletInvitation,
  | 'id'
  | 'state'
  | 'email'
  | 'createdAt'
  | 'updatedAt'
  | 'expiredAt'
  | 'acceptedAt'
  | 'declinedAt'
> & { permissionTypeTags: PermissionTypeTag[]; walletId: Wallet['uuid'] };

export class GetAllWalletInvitationByEmailResponseItem
  extends AutoValidator
  implements TGetAllWalletInvitationByEmailResponseItem
{
  @IsUUID(4)
  id: string;

  @IsEnum(WalletInvitationState)
  state: WalletInvitationState;

  @IsEmail()
  email: string;

  @IsUUID(4)
  walletId: Wallet['uuid'];

  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expiredAt',
  })
  expiredAt: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format acceptedAt',
  })
  acceptedAt?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format declinedAt',
  })
  declinedAt?: Date;

  constructor(props: TGetAllWalletInvitationByEmailResponseItem) {
    super(props);
  }
}

export class GetAllWalletInvitationByEmailResponse extends PaginationResponse<GetAllWalletInvitationByEmailResponseItem> {}

export class GetAllWalletInvitationByEmailController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletInvitationRepository: WalletInvitationRepository,
  ) {
    this.logger = logger.child({
      context: GetAllWalletInvitationByEmailController.name,
    });
    this.usecase = new UseCase(this.logger, walletInvitationRepository);
  }

  async execute(
    request: GetAllWalletInvitationByEmailRequest,
  ): Promise<GetAllWalletInvitationByEmailResponse> {
    this.logger.debug(
      'Get all wallet invitations by contact information request.',
      { request },
    );

    const {
      state,
      email,
      acceptedAtPeriodStart,
      acceptedAtPeriodEnd,
      declinedAtPeriodStart,
      declinedAtPeriodEnd,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: TGetWalletInvitationsFilter = {
      ...(state && { state }),
      ...(acceptedAtPeriodStart && { acceptedAtPeriodStart }),
      ...(acceptedAtPeriodEnd && { acceptedAtPeriodEnd }),
      ...(declinedAtPeriodStart && { declinedAtPeriodStart }),
      ...(declinedAtPeriodEnd && { declinedAtPeriodEnd }),
      ...(createdAtPeriodStart && { createdAtPeriodStart }),
      ...(createdAtPeriodEnd && { createdAtPeriodEnd }),
    };

    const result = await this.usecase.execute(pagination, filter, email);

    const data = result.data.map(
      (item) =>
        new GetAllWalletInvitationByEmailResponseItem({
          id: item.id,
          state: item.state,
          email: item.email,
          walletId: item.wallet.uuid,
          permissionTypeTags: item.permissionTypes.map(({ tag }) => tag),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          expiredAt: item.expiredAt,
          acceptedAt: item.acceptedAt,
          declinedAt: item.declinedAt,
        }),
    );

    const response = new GetAllWalletInvitationByEmailResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all walletInvitation response.', { response });

    return response;
  }
}
