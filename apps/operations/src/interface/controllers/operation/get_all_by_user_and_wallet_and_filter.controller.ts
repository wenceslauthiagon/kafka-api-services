import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
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
import { User, UserEntity } from '@zro/users/domain';
import {
  WalletAccount,
  Currency,
  WalletEntity,
  Wallet,
  Operation,
  TransactionType,
  OperationState,
  OperationRepository,
  WalletAccountCacheRepository,
  TGetOperationsFilter,
  UserWalletRepository,
} from '@zro/operations/domain';
import { GetAllOperationsByUserAndWalletAndFilterUseCase as UseCase } from '@zro/operations/application';

export enum GetAllOperationsByUserAndWalletAndFilterRequestSort {
  CREATED_AT = 'created_at',
}

type TGetAllOperationsByUserAndWalletAndFilterRequest = Pagination &
  TGetOperationsFilter & {
    userId: User['uuid'];
    walletId: Wallet['uuid'];
  };

export class GetAllOperationsByUserAndWalletAndFilterRequest
  extends PaginationRequest
  implements TGetAllOperationsByUserAndWalletAndFilterRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  walletId: string;

  @IsOptional()
  @Sort(GetAllOperationsByUserAndWalletAndFilterRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  currencySymbol?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  transactionTag?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd?: Date;

  constructor(props: TGetAllOperationsByUserAndWalletAndFilterRequest) {
    super(props);
  }
}

type TGetAllOperationsByUserAndWalletAndFilterResponseItem = Pick<
  Operation,
  'id' | 'fee' | 'state' | 'description' | 'revertedAt' | 'createdAt' | 'value'
> & {
  currencyId: Currency['id'];
  currencySymbol: Currency['symbol'];
  transactionId: TransactionType['id'];
  transactionTag: TransactionType['tag'];
  ownerWalletUuid?: WalletAccount['uuid'];
  beneficiaryWalletUuid?: WalletAccount['uuid'];
  operationRefId?: Operation['id'];
  chargebackId?: Operation['id'];
};

export class GetAllOperationsByUserAndWalletAndFilterResponseItem
  extends AutoValidator
  implements TGetAllOperationsByUserAndWalletAndFilterResponseItem
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @IsEnum(OperationState)
  state: OperationState;

  @IsString()
  @MaxLength(140)
  description: string;

  @IsInt()
  @Min(0)
  value: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format revertedAt',
  })
  revertedAt?: Date;

  @IsInt()
  @IsPositive()
  currencyId: number;

  @IsString()
  @Length(1, 255)
  currencySymbol: string;

  @IsInt()
  @IsPositive()
  transactionId: number;

  @IsString()
  @Length(1, 255)
  transactionTag: string;

  @IsOptional()
  @IsUUID(4)
  ownerWalletUuid?: string;

  @IsOptional()
  @IsUUID(4)
  beneficiaryWalletUuid?: string;

  @IsOptional()
  @IsUUID(4)
  operationRefId?: string;

  @IsOptional()
  @IsUUID(4)
  chargebackId?: string;

  constructor(props: TGetAllOperationsByUserAndWalletAndFilterResponseItem) {
    super(props);
  }
}

export class GetAllOperationsByUserAndWalletAndFilterResponse extends PaginationResponse<GetAllOperationsByUserAndWalletAndFilterResponseItem> {}

export class GetAllOperationsByUserAndWalletAndFilterController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    walletAccountCacheRepository: WalletAccountCacheRepository,
    userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({
      context: GetAllOperationsByUserAndWalletAndFilterController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
    );
  }

  async execute(
    request: GetAllOperationsByUserAndWalletAndFilterRequest,
  ): Promise<GetAllOperationsByUserAndWalletAndFilterResponse> {
    this.logger.debug('Get all operations request.', { request });

    const {
      userId,
      walletId,
      createdAtStart,
      createdAtEnd,
      currencySymbol,
      transactionTag,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });
    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: TGetOperationsFilter = {
      ...(currencySymbol && { currencySymbol }),
      ...(transactionTag && { transactionTag }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
    };

    const result = await this.usecase.execute(user, wallet, pagination, filter);

    const data = result.data.map(
      (operation) =>
        new GetAllOperationsByUserAndWalletAndFilterResponseItem({
          id: operation.id,
          fee: operation.fee,
          state: operation.state,
          description: operation.description,
          value: operation.value,
          createdAt: operation.createdAt,
          revertedAt: operation.revertedAt,
          currencyId: operation.currency.id,
          currencySymbol: operation.currency.symbol,
          transactionId: operation.transactionType.id,
          transactionTag: operation.transactionType.tag,
          ownerWalletUuid: operation.ownerWalletAccount?.wallet?.uuid ?? null,
          beneficiaryWalletUuid:
            operation.beneficiaryWalletAccount?.wallet?.uuid ?? null,
          operationRefId: operation.operationRef?.id ?? null,
          chargebackId: operation.chargeback?.id ?? null,
        }),
    );

    const response = new GetAllOperationsByUserAndWalletAndFilterResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all operations response.', { response });

    return response;
  }
}
