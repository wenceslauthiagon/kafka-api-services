import { Logger } from 'winston';
import {
  IsBoolean,
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
  AutoValidator,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import {
  Currency,
  Operation,
  OperationRepository,
  OperationState,
  TGetOperationsFilter,
  TransactionType,
  WalletAccount,
  WalletAccountRepository,
} from '@zro/operations/domain';
import {
  GetAllOperationsByFilterUseCase as UseCase,
  UserService,
} from '@zro/operations/application';
import { PersonType, User } from '@zro/users/domain';

export enum GetAllOperationsByFilterRequestSort {
  CREATED_AT = 'created_at',
}

type TGetAllOperationsByFilterRequest = Pagination & TGetOperationsFilter;

export class GetAllOperationsByFilterRequest
  extends PaginationRequest
  implements TGetAllOperationsByFilterRequest
{
  @IsOptional()
  @Sort(GetAllOperationsByFilterRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  currencyTag?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  transactionTag?: string;

  @IsOptional()
  @IsBoolean()
  nonChargeback?: boolean;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd?: Date;

  constructor(props: TGetAllOperationsByFilterRequest) {
    super(props);
  }
}

type TGetAllOperationsByFilterResponseItem = Pick<
  Operation,
  'id' | 'fee' | 'state' | 'description' | 'createdAt' | 'value'
> & {
  currencyId: Currency['id'];
  transactionId: TransactionType['id'];
  transactionTag: TransactionType['tag'];
  ownerId?: User['uuid'];
  ownerDocument?: User['document'];
  ownerType?: PersonType;
  ownerName?: string;
  beneficiaryId?: User['uuid'];
  beneficiaryDocument?: User['document'];
  beneficiaryType?: PersonType;
  beneficiaryName?: string;
  ownerWalletId?: WalletAccount['uuid'];
  beneficiaryWalletId?: WalletAccount['uuid'];
  operationRefId?: Operation['id'];
  chargebackId?: Operation['id'];
};

export class GetAllOperationsByFilterResponseItem
  extends AutoValidator
  implements TGetAllOperationsByFilterResponseItem
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

  @IsInt()
  @IsPositive()
  currencyId: Currency['id'];

  @IsInt()
  @IsPositive()
  transactionId: TransactionType['id'];

  @IsString()
  @Length(1, 255)
  transactionTag: TransactionType['tag'];

  @IsOptional()
  @IsUUID(4)
  ownerId?: User['uuid'];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  ownerDocument?: User['document'];

  @IsOptional()
  @IsEnum(PersonType)
  ownerType?: PersonType;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  ownerName?: User['name'];

  @IsOptional()
  @IsUUID(4)
  beneficiaryId?: User['uuid'];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  beneficiaryDocument?: User['document'];

  @IsOptional()
  @IsEnum(PersonType)
  beneficiaryType?: PersonType;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  beneficiaryName?: User['name'];

  @IsOptional()
  @IsUUID(4)
  ownerWalletId?: WalletAccount['uuid'];

  @IsOptional()
  @IsUUID(4)
  beneficiaryWalletId?: WalletAccount['uuid'];

  @IsOptional()
  @IsUUID(4)
  operationRefId?: Operation['id'];

  @IsOptional()
  @IsUUID(4)
  chargebackId?: string;

  constructor(props: TGetAllOperationsByFilterResponseItem) {
    super(props);
  }
}

export class GetAllOperationsByFilterResponse extends PaginationResponse<GetAllOperationsByFilterResponseItem> {}

export class GetAllOperationsByFilterController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    walletAccountRepository: WalletAccountRepository,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetAllOperationsByFilterController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationRepository,
      walletAccountRepository,
      userService,
    );
  }

  async execute(
    request: GetAllOperationsByFilterRequest,
  ): Promise<GetAllOperationsByFilterResponse> {
    this.logger.debug('Get all operations by filter request.', { request });

    const {
      createdAtStart,
      createdAtEnd,
      currencyTag,
      transactionTag,
      nonChargeback,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: TGetOperationsFilter = {
      ...(currencyTag && { currencyTag }),
      ...(transactionTag && { transactionTag }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
      ...(nonChargeback && { nonChargeback }),
    };

    const result = await this.usecase.execute(pagination, filter);

    const data = result.data.map((operation) => {
      return new GetAllOperationsByFilterResponseItem({
        id: operation.id,
        fee: operation.fee,
        state: operation.state,
        description: operation.description,
        value: operation.value,
        createdAt: operation.createdAt,
        currencyId: operation.currency.id,
        transactionId: operation.transactionType.id,
        transactionTag: operation.transactionType.tag,
        ownerWalletId: operation.ownerWalletAccount?.wallet?.uuid ?? null,
        beneficiaryWalletId:
          operation.beneficiaryWalletAccount?.wallet?.uuid ?? null,
        operationRefId: operation.operationRef?.id ?? null,
        chargebackId: operation.chargeback?.id ?? null,
        ownerId: operation.owner?.uuid ?? null,
        ownerDocument: operation.owner?.document ?? null,
        ownerType: operation.owner?.type ?? null,
        ownerName: operation.owner?.name ?? null,
        beneficiaryId: operation.beneficiary?.uuid ?? null,
        beneficiaryDocument: operation.beneficiary?.document ?? null,
        beneficiaryType: operation.beneficiary?.type ?? null,
        beneficiaryName: operation.beneficiary?.name ?? null,
      });
    });

    const response = new GetAllOperationsByFilterResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all operations by filter response.', {
      operations: response,
    });

    return response;
  }
}
