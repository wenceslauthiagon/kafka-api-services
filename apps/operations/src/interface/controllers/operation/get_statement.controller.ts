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
  IsSameMonth,
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
  TGetOperationsFilter,
  UserWalletRepository,
  WalletAccountTransaction,
  WalletAccountTransactionType,
  WalletAccountTransactionRepository,
  WalletAccountCacheRepository,
} from '@zro/operations/domain';
import { GetStatementUseCase as UseCase } from '@zro/operations/application';

export enum GetStatementRequestSort {
  CREATED_AT = 'created_at',
}

type TGetStatementRequest = Pagination &
  TGetOperationsFilter & {
    userId: User['uuid'];
    walletId: Wallet['uuid'];
  };

export class GetStatementRequest
  extends PaginationRequest
  implements TGetStatementRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  walletId: string;

  @IsOptional()
  @Sort(GetStatementRequestSort)
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
  @IsInt()
  @IsPositive()
  value?: number;

  @IsOptional()
  @IsEnum(OperationState, { each: true })
  states?: OperationState[];

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  @IsSameMonth('createdAtEnd', false, {
    message: 'createdAtStart must have the same month as the createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  @IsSameMonth('createdAtStart', false, {
    message: 'createdAtEnd must have the same month as the createdAtStart',
  })
  createdAtEnd?: Date;

  constructor(props: TGetStatementRequest) {
    super(props);
  }
}

type TGetStatementResponseItem = Pick<
  Operation,
  'id' | 'fee' | 'state' | 'description' | 'revertedAt' | 'createdAt' | 'value'
> & {
  currencyId: Currency['id'];
  currencySymbol: Currency['symbol'];
  transactionTypeId: TransactionType['id'];
  transactionTag: TransactionType['tag'];
  transactionType?: WalletAccountTransaction['transactionType'];
  updatedBalance?: WalletAccountTransaction['updatedBalance'];
  ownerWalletUuid?: WalletAccount['uuid'];
  beneficiaryWalletUuid?: WalletAccount['uuid'];
  operationRefId?: Operation['id'];
  chargebackId?: Operation['id'];
};

export class GetStatementResponseItem
  extends AutoValidator
  implements TGetStatementResponseItem
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

  @IsOptional()
  @IsInt()
  @Min(0)
  updatedBalance?: number;

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
  transactionTypeId: number;

  @IsString()
  @Length(1, 255)
  transactionTag: string;

  @IsOptional()
  @IsEnum(WalletAccountTransactionType)
  @Length(1, 255)
  transactionType?: WalletAccountTransactionType;

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

  constructor(props: TGetStatementResponseItem) {
    super(props);
  }
}

export class GetStatementResponse extends PaginationResponse<GetStatementResponseItem> {}

export class GetStatementController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    walletAccountCacheRepository: WalletAccountCacheRepository,
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({
      context: GetStatementController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationRepository,
      walletAccountCacheRepository,
      walletAccountTransactionRepository,
      userWalletRepository,
    );
  }

  async execute(request: GetStatementRequest): Promise<GetStatementResponse> {
    this.logger.debug('Get all operations request.', { request });

    const {
      userId,
      walletId,
      createdAtStart,
      createdAtEnd,
      currencySymbol,
      transactionTag,
      value,
      states,
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
      ...(value && { value }),
      ...(states && { states }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
    };

    const result = await this.usecase.execute(user, wallet, pagination, filter);

    const data = result.data.map(
      (item) =>
        new GetStatementResponseItem({
          id: item.operation.id,
          fee: item.operation.fee,
          state: item.operation.state,
          description: item.operation.description,
          value: item.operation.value,
          updatedBalance: item.walletAccountTransaction?.updatedBalance,
          createdAt: item.operation.createdAt,
          revertedAt: item.operation.revertedAt,
          currencyId: item.operation.currency.id,
          currencySymbol: item.operation.currency.symbol,
          transactionTypeId: item.operation.transactionType.id,
          transactionTag: item.operation.transactionType.tag,
          transactionType: item.walletAccountTransaction?.transactionType,
          ownerWalletUuid: item.operation.ownerWalletAccount?.wallet?.uuid,
          beneficiaryWalletUuid:
            item.operation.beneficiaryWalletAccount?.wallet?.uuid,
          operationRefId: item.operation.operationRef?.id,
          chargebackId: item.operation.chargeback?.id,
        }),
    );

    const response = new GetStatementResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all operations response.', { response });

    return response;
  }
}
