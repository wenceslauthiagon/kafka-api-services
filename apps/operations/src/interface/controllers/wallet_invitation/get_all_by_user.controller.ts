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
import { User, UserEntity } from '@zro/users/domain';
import { GetAllWalletInvitationByUserUseCase as UseCase } from '@zro/operations/application';

export enum GetAllWalletInvitationByUserRequestSort {
  STATE = 'state',
  CREATED_AT = 'created_at',
}

type PermissionTypeTag = PermissionType['tag'];
type TGetAllWalletInvitationByUserRequest = Pagination &
  TGetWalletInvitationsFilter & { userId: User['uuid'] };

export class GetAllWalletInvitationByUserRequest
  extends PaginationRequest
  implements TGetAllWalletInvitationByUserRequest
{
  @IsOptional()
  @Sort(GetAllWalletInvitationByUserRequestSort)
  sort?: PaginationSort;

  @IsUUID(4)
  userId: User['uuid'];

  @IsEnum(WalletInvitationState)
  @IsOptional()
  state: WalletInvitationState;

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
    message: 'Invalid format date expiredAtPeriodStart',
  })
  @IsDateBeforeThan('expiredAtPeriodEnd', false, {
    message: 'expiredAtPeriodStart must be before than expiredAtPeriodEnd',
  })
  expiredAtPeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date expiredAtPeriodEnd',
  })
  @IsDateAfterThan('expiredAtPeriodStart', false, {
    message: 'expiredAtPeriodEnd must be after than expiredAtPeriodStart',
  })
  expiredAtPeriodEnd?: Date;

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

  constructor(props: TGetAllWalletInvitationByUserRequest) {
    super(props);
  }
}

type TGetAllWalletInvitationByUserResponseItem = Pick<
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

export class GetAllWalletInvitationByUserResponseItem
  extends AutoValidator
  implements TGetAllWalletInvitationByUserResponseItem
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

  constructor(props: TGetAllWalletInvitationByUserResponseItem) {
    super(props);
  }
}

export class GetAllWalletInvitationByUserResponse extends PaginationResponse<GetAllWalletInvitationByUserResponseItem> {}

export class GetAllWalletInvitationByUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletInvitationRepository: WalletInvitationRepository,
  ) {
    this.logger = logger.child({
      context: GetAllWalletInvitationByUserController.name,
    });
    this.usecase = new UseCase(this.logger, walletInvitationRepository);
  }

  async execute(
    request: GetAllWalletInvitationByUserRequest,
  ): Promise<GetAllWalletInvitationByUserResponse> {
    this.logger.debug('Get all wallet invitations by user request.', {
      request,
    });

    const {
      state,
      userId,
      acceptedAtPeriodStart,
      acceptedAtPeriodEnd,
      declinedAtPeriodStart,
      declinedAtPeriodEnd,
      expiredAtPeriodStart,
      expiredAtPeriodEnd,
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
      ...(expiredAtPeriodStart && { expiredAtPeriodStart }),
      ...(expiredAtPeriodEnd && { expiredAtPeriodEnd }),
      ...(createdAtPeriodStart && { createdAtPeriodStart }),
      ...(createdAtPeriodEnd && { createdAtPeriodEnd }),
    };

    const user = new UserEntity({ uuid: userId });

    const result = await this.usecase.execute(pagination, filter, user);

    const data = result.data.map(
      (item) =>
        new GetAllWalletInvitationByUserResponseItem({
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

    const response = new GetAllWalletInvitationByUserResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all walletInvitation response.', { response });

    return response;
  }
}
