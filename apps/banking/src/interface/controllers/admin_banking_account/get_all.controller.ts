import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsInt,
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
} from '@zro/common';
import {
  AdminBankingAccount,
  AdminBankingAccountRepository,
  TGetAdminBankingAccountFilter,
} from '@zro/banking/domain';
import { Admin } from '@zro/admin/domain';
import { GetAllAdminBankingAccountUseCase as UseCase } from '@zro/banking/application';
import { AccountType } from '@zro/pix-payments/domain';

export enum GetAllAdminBankingAccountRequestSort {
  ID = 'id',
  CREATED_AT = 'created_at',
  CONFIRMED_AT = 'confirmed_at',
  FAILED_AT = 'failed_at',
}

type AdminId = Admin['id'];

export type TGetAllAdminBankingAccountRequest = Pagination &
  TGetAdminBankingAccountFilter;

export class GetAllAdminBankingAccountRequest
  extends PaginationRequest
  implements TGetAllAdminBankingAccountRequest
{
  @IsOptional()
  @Sort(GetAllAdminBankingAccountRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  branchNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountDigit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankCode?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', true, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', true, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd?: Date;

  constructor(props: TGetAllAdminBankingAccountRequest) {
    super(props);
  }
}

type TGetAllAdminBankingAccountResponseItem = Pick<
  AdminBankingAccount,
  | 'id'
  | 'document'
  | 'fullName'
  | 'branchNumber'
  | 'accountNumber'
  | 'accountDigit'
  | 'accountType'
  | 'bankName'
  | 'bankCode'
  | 'description'
  | 'enabled'
  | 'createdAt'
> & {
  createdByAdminId: number;
  updatedByAdminId: number;
};

export class GetAllAdminBankingAccountResponseItem
  extends AutoValidator
  implements TGetAllAdminBankingAccountResponseItem
{
  @IsUUID(4)
  id: string;

  @IsString()
  document: string;

  @IsString()
  fullName: string;

  @IsString()
  branchNumber: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountDigit: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsString()
  bankName: string;

  @IsString()
  bankCode: string;

  @IsString()
  description: string;

  @IsBoolean()
  enabled: boolean;

  @IsInt()
  @IsPositive()
  createdByAdminId: AdminId;

  @IsInt()
  @IsPositive()
  updatedByAdminId: AdminId;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  createdAt?: Date;

  constructor(props: TGetAllAdminBankingAccountResponseItem) {
    super(props);
  }
}

export class GetAllAdminBankingAccountResponse extends PaginationResponse<GetAllAdminBankingAccountResponseItem> {}

export class GetAllAdminBankingAccountController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    repository: AdminBankingAccountRepository,
  ) {
    this.logger = logger.child({
      context: GetAllAdminBankingAccountController.name,
    });
    this.usecase = new UseCase(this.logger, repository);
  }

  async execute(
    request: GetAllAdminBankingAccountRequest,
  ): Promise<GetAllAdminBankingAccountResponse> {
    const {
      order,
      sort,
      page,
      pageSize,
      accountDigit,
      accountNumber,
      bankCode,
      bankName,
      branchNumber,
      createdAtStart,
      createdAtEnd,
    } = request;

    this.logger.debug('GetAll AdminBankingAccounts.', { request });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const filter: TGetAdminBankingAccountFilter = {
      ...(accountDigit && { accountDigit }),
      ...(accountNumber && { accountNumber }),
      ...(bankCode && { bankCode }),
      ...(bankName && { bankName }),
      ...(branchNumber && { branchNumber }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
    };

    const results = await this.usecase.execute(pagination, filter);

    const data = results.data.map(
      (adminBankingAccount) =>
        new GetAllAdminBankingAccountResponseItem({
          id: adminBankingAccount.id,
          document: adminBankingAccount.document,
          fullName: adminBankingAccount.fullName,
          branchNumber: adminBankingAccount.branchNumber,
          accountNumber: adminBankingAccount.accountNumber,
          accountDigit: adminBankingAccount.accountDigit,
          accountType: adminBankingAccount.accountType,
          bankName: adminBankingAccount.bankName,
          bankCode: adminBankingAccount.bankCode,
          description: adminBankingAccount.description,
          enabled: adminBankingAccount.enabled,
          createdByAdminId: adminBankingAccount.createdByAdmin.id,
          updatedByAdminId: adminBankingAccount.updatedByAdmin.id,
          createdAt: adminBankingAccount.createdAt,
        }),
    );

    const response = new GetAllAdminBankingAccountResponse({
      ...results,
      data,
    });

    this.logger.info('GetAll adminBankingAccounts response.', {
      adminBankingAccounts: response,
    });

    return response;
  }
}
