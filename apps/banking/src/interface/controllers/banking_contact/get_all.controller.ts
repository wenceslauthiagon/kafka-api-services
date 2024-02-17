import { Logger } from 'winston';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
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
  BankingAccountContact,
  BankingContact,
  BankingContactRepository,
  TGetBankingContactFilter,
} from '@zro/banking/domain';
import { GetAllBankingContactUseCase as UseCase } from '@zro/banking/application';
import { PersonDocumentType, User, UserEntity } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';

export enum GetAllBankingContactRequestSort {
  NAME = 'name',
  CREATED_AT = 'created_at',
}

type UserId = User['id'];

export type TGetAllBankingContactRequest = Pagination &
  TGetBankingContactFilter & { userId: UserId };

export class GetAllBankingContactRequest
  extends PaginationRequest
  implements TGetAllBankingContactRequest
{
  @IsOptional()
  @Sort(GetAllBankingContactRequestSort)
  sort?: PaginationSort;

  @IsInt()
  @IsPositive()
  userId: UserId;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  @IsCpfOrCnpj()
  document?: string;

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

  constructor(props: TGetAllBankingContactRequest) {
    super(props);
  }
}

type TGetAllBankingAccountContactResponseItem = Pick<
  BankingAccountContact,
  | 'id'
  | 'branchNumber'
  | 'accountNumber'
  | 'accountDigit'
  | 'bankName'
  | 'bankCode'
  | 'accountType'
  | 'createdAt'
>;

export class GetAllBankingAccountContactResponseItem
  extends AutoValidator
  implements TGetAllBankingAccountContactResponseItem
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsString()
  @MaxLength(255)
  branchNumber: string;

  @IsString()
  @MaxLength(255)
  accountNumber: string;

  @IsString()
  @MaxLength(255)
  accountDigit: string;

  @IsString()
  @MaxLength(255)
  bankName: string;

  @IsString()
  @MaxLength(255)
  bankCode: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllBankingAccountContactResponseItem) {
    super(props);
  }
}

type TGetAllBankingContactResponseItem = Pick<
  BankingContact,
  'id' | 'name' | 'document' | 'documentType' | 'createdAt'
> & {
  userId: UserId;
  contactUserId: UserId;
  accounts: GetAllBankingAccountContactResponseItem[];
};

export class GetAllBankingContactResponseItem
  extends AutoValidator
  implements TGetAllBankingContactResponseItem
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsInt()
  @IsPositive()
  userId: UserId;

  @IsString()
  name: string;

  @IsString()
  @IsCpfOrCnpj()
  document: string;

  @IsEnum(PersonDocumentType)
  documentType: PersonDocumentType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  contactUserId: UserId;

  @IsArray()
  accounts: GetAllBankingAccountContactResponseItem[];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllBankingContactResponseItem) {
    super(props);
    this.accounts = props.accounts.map(
      (item) => new GetAllBankingAccountContactResponseItem(item),
    );
  }
}

export class GetAllBankingContactResponse extends PaginationResponse<GetAllBankingContactResponseItem> {}

export class GetAllBankingContactController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingContactRepository: BankingContactRepository,
  ) {
    this.logger = logger.child({
      context: GetAllBankingContactController.name,
    });
    this.usecase = new UseCase(this.logger, bankingContactRepository);
  }

  async execute(
    request: GetAllBankingContactRequest,
  ): Promise<GetAllBankingContactResponse> {
    const {
      order,
      page,
      pageSize,
      sort,
      userId,
      name,
      document,
      createdAtStart,
      createdAtEnd,
    } = request;
    this.logger.debug('GetAll BankingContacts.', { request });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = new UserEntity({ id: userId });
    const filter: TGetBankingContactFilter = {
      ...(name && { name }),
      ...(document && { document }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
    };

    const results = await this.usecase.execute(user, pagination, filter);

    const data = results.data.map(
      (bankingContact) =>
        new GetAllBankingContactResponseItem({
          id: bankingContact.id,
          userId: bankingContact.user.id,
          name: bankingContact.name,
          document: bankingContact.document,
          documentType: bankingContact.documentType,
          contactUserId: bankingContact.contactUser?.id,
          accounts: bankingContact.accounts.map((account) => ({
            id: account.id,
            branchNumber: account.branchNumber,
            accountNumber: account.accountNumber,
            accountDigit: account.accountDigit,
            bankName: account.bankName,
            bankCode: account.bankCode,
            accountType: account.accountType,
            createdAt: account.createdAt,
          })),
          createdAt: bankingContact.createdAt,
        }),
    );

    const response = new GetAllBankingContactResponse({ ...results, data });

    this.logger.debug('GetAll bankingContacts response.', {
      bankingContacts: response,
    });

    return response;
  }
}
