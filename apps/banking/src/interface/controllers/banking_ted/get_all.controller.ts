import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  Pagination,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  PaginationResponse,
  IsIsoStringDateFormat,
  Sort,
  PaginationSort,
  IsDateBeforeThan,
  IsDateAfterThan,
  IsCpfOrCnpj,
} from '@zro/common';
import {
  BankingTed,
  BankingTedRepository,
  BankingTedState,
  TGetBankingTedFilter,
} from '@zro/banking/domain';
import { GetAllBankingTedUseCase as UseCase } from '@zro/banking/application';
import { User, UserEntity } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import { AccountType } from '@zro/pix-payments/domain';

export enum GetAllBankingTedRequestSort {
  ID = 'id',
  CREATED_AT = 'created_at',
  CONFIRMED_AT = 'confirmed_at',
  FAILED_AT = 'failed_at',
}

type UserId = User['uuid'];
type OperationId = Operation['id'];

export type TGetAllBankingTedRequest = Pagination &
  TGetBankingTedFilter & { userId: UserId; operationId?: OperationId };

export class GetAllBankingTedRequest
  extends PaginationRequest
  implements TGetAllBankingTedRequest
{
  @IsOptional()
  @Sort(GetAllBankingTedRequestSort)
  sort?: PaginationSort;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsUUID(4)
  operationId?: string;

  @IsOptional()
  @IsEnum(BankingTedState)
  state?: BankingTedState;

  @IsOptional()
  @IsNumberString()
  @IsCpfOrCnpj()
  beneficiaryDocument?: string;

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

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date confirmedAtStart',
  })
  @IsDateBeforeThan('confirmedAtEnd', false, {
    message: 'confirmedAtStart must be before than confirmedAtEnd',
  })
  confirmedAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date confirmedAtEnd',
  })
  @IsDateAfterThan('confirmedAtStart', false, {
    message: 'confirmedAtEnd must be after than confirmedAtStart',
  })
  confirmedAtEnd?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date failedAtStart',
  })
  @IsDateBeforeThan('failedAtEnd', false, {
    message: 'failedAtStart must be before than failedAtEnd',
  })
  failedAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date failedAtEnd',
  })
  @IsDateAfterThan('failedAtStart', false, {
    message: 'failedAtEnd must be after than failedAtStart',
  })
  failedAtEnd?: Date;

  constructor(props: TGetAllBankingTedRequest) {
    super(props);
  }
}

type TGetAllBankingTedResponseItem = Pick<
  BankingTed,
  | 'id'
  | 'amount'
  | 'state'
  | 'transactionId'
  | 'beneficiaryBankName'
  | 'beneficiaryBankCode'
  | 'beneficiaryName'
  | 'beneficiaryType'
  | 'beneficiaryDocument'
  | 'beneficiaryAgency'
  | 'beneficiaryAccount'
  | 'beneficiaryAccountDigit'
  | 'beneficiaryAccountType'
  | 'createdAt'
  | 'confirmedAt'
  | 'failedAt'
> & {
  operationId: OperationId;
};

export class GetAllBankingTedResponseItem
  extends AutoValidator
  implements TGetAllBankingTedResponseItem
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  operationId: OperationId;

  @IsOptional()
  @IsEnum(BankingTedState)
  state?: BankingTedState;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  beneficiaryBankName?: string;

  @IsString()
  @MaxLength(255)
  beneficiaryBankCode: string;

  @IsString()
  @MaxLength(255)
  beneficiaryName: string;

  @IsString()
  @MaxLength(255)
  beneficiaryType: string;

  @IsString()
  @MaxLength(255)
  beneficiaryDocument: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAgency: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccount: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccountDigit: string;

  @IsEnum(AccountType)
  beneficiaryAccountType: AccountType;

  @IsUUID(4)
  @IsOptional()
  transactionId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  confirmedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  failedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  createdAt?: Date;

  constructor(props: TGetAllBankingTedResponseItem) {
    super(props);
  }
}

export class GetAllBankingTedResponse extends PaginationResponse<GetAllBankingTedResponseItem> {}

export class GetAllBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetAllBankingTedController.name,
    });
    this.usecase = new UseCase(this.logger, bankingTedRepository);
  }

  async execute(
    request: GetAllBankingTedRequest,
  ): Promise<GetAllBankingTedResponse> {
    const {
      order,
      page,
      pageSize,
      sort,
      userId,
      operationId,
      state,
      beneficiaryDocument,
      createdAtStart,
      createdAtEnd,
      confirmedAtStart,
      confirmedAtEnd,
      failedAtStart,
      failedAtEnd,
    } = request;
    this.logger.debug('GetAll BankingTeds.', { request });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = new UserEntity({ uuid: userId });
    const filter: TGetBankingTedFilter = {
      ...(operationId && { operationId }),
      ...(state && { state }),
      ...(beneficiaryDocument && { beneficiaryDocument }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
      ...(confirmedAtStart && { confirmedAtStart }),
      ...(confirmedAtEnd && { confirmedAtEnd }),
      ...(failedAtStart && { failedAtStart }),
      ...(failedAtEnd && { failedAtEnd }),
    };

    const results = await this.usecase.execute(pagination, user, filter);

    const data = results.data.map(
      (bankingTed) =>
        new GetAllBankingTedResponseItem({
          id: bankingTed.id,
          transactionId: bankingTed.transactionId,
          operationId: bankingTed.operation.id,
          state: bankingTed.state,
          amount: bankingTed.amount,
          beneficiaryBankCode: bankingTed.beneficiaryBankCode,
          beneficiaryBankName: bankingTed.beneficiaryBankName,
          beneficiaryName: bankingTed.beneficiaryName,
          beneficiaryType: bankingTed.beneficiaryType,
          beneficiaryDocument: bankingTed.beneficiaryDocument,
          beneficiaryAgency: bankingTed.beneficiaryAgency,
          beneficiaryAccount: bankingTed.beneficiaryAccount,
          beneficiaryAccountDigit: bankingTed.beneficiaryAccountDigit,
          beneficiaryAccountType: bankingTed.beneficiaryAccountType,
          createdAt: bankingTed.createdAt,
          confirmedAt: bankingTed.confirmedAt,
          failedAt: bankingTed.failedAt,
        }),
    );

    const response = new GetAllBankingTedResponse({ ...results, data });

    this.logger.info('GetAll bankingTeds response.', {
      bankingTeds: response,
    });

    return response;
  }
}
