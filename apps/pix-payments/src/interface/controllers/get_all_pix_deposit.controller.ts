import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
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
  AccountType,
  PixDeposit,
  PixDepositRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import { Bank } from '@zro/banking/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import { User, UserEntity, PersonDocumentType } from '@zro/users/domain';
import { GetAllPixDepositUseCase as UseCase } from '@zro/pix-payments/application';

export enum GetAllPixDepositRequestSort {
  CREATED_AT = 'created_at',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

export type TGetAllPixDepositRequest = Pagination & {
  userId?: UserId;
  walletId?: WalletId;
  createdAtPeriodStart?: Date;
  createdAtPeriodEnd?: Date;
  endToEndId?: string;
  clientDocument?: string;
  states?: PixDepositState[];
};

export class GetAllPixDepositRequest
  extends PaginationRequest
  implements TGetAllPixDepositRequest
{
  @IsOptional()
  @Sort(GetAllPixDepositRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsUUID(4)
  userId?: UserId;

  @IsOptional()
  @IsUUID(4)
  walletId?: WalletId;

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

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientDocument?: string;

  @IsOptional()
  @IsEnum(PixDepositState, { each: true })
  states?: PixDepositState[];

  constructor(props: TGetAllPixDepositRequest) {
    super(props);
  }
}

type TGetAllPixDepositResponseItem = Pick<
  PixDeposit,
  | 'id'
  | 'endToEndId'
  | 'txId'
  | 'state'
  | 'amount'
  | 'clientBank'
  | 'clientBranch'
  | 'clientAccountNumber'
  | 'clientPersonType'
  | 'clientDocument'
  | 'clientName'
  | 'clientKey'
  | 'thirdPartBank'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartPersonType'
  | 'thirdPartDocument'
  | 'thirdPartName'
  | 'thirdPartKey'
  | 'createdAt'
> & { userId: UserId; availableAmount: number; operationId: OperationId };

export class GetAllPixDepositResponseItem
  extends AutoValidator
  implements TGetAllPixDepositResponseItem
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId: string;

  @IsUUID(4)
  userId: UserId;

  @IsInt()
  @Min(0)
  amount: number;

  @IsInt()
  availableAmount: number;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsObject()
  thirdPartBank: Bank;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch: string;

  @IsOptional()
  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  thirdPartPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName: string;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsObject()
  clientBank: Bank;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientBranch: string;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  clientPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  clientKey: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllPixDepositResponseItem) {
    super(props);
  }
}

export class GetAllPixDepositResponse extends PaginationResponse<GetAllPixDepositResponseItem> {}

export class GetAllPixDepositController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({ context: GetAllPixDepositController.name });

    this.usecase = new UseCase(this.logger, depositRepository);
  }

  async execute(
    request: GetAllPixDepositRequest,
  ): Promise<GetAllPixDepositResponse> {
    this.logger.debug('GetAll Deposits.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      userId,
      walletId,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = userId && new UserEntity({ uuid: userId });
    const wallet = walletId && new WalletEntity({ uuid: walletId });

    const results = await this.usecase.execute(
      pagination,
      user,
      wallet,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    );

    const data = results.data.map(
      (deposit) =>
        new GetAllPixDepositResponseItem({
          id: deposit.id,
          endToEndId: deposit.endToEndId,
          txId: deposit.txId,
          operationId: deposit.operation.id,
          state: deposit.state,
          userId: deposit.user.uuid,
          amount: deposit.amount,
          availableAmount: deposit.amount - deposit.returnedAmount,
          createdAt: deposit.createdAt,
          clientBank: deposit.clientBank,
          clientBranch: deposit.clientBranch,
          clientAccountNumber: deposit.clientAccountNumber,
          clientPersonType: deposit.clientPersonType,
          clientDocument: deposit.clientDocument,
          clientName: deposit.clientName,
          clientKey: deposit.clientKey,
          thirdPartBank: deposit.thirdPartBank,
          thirdPartBranch: deposit.thirdPartBranch,
          thirdPartAccountType: deposit.thirdPartAccountType,
          thirdPartAccountNumber: deposit.thirdPartAccountNumber,
          thirdPartPersonType: deposit.thirdPartPersonType,
          thirdPartDocument: deposit.thirdPartDocument,
          thirdPartName: deposit.thirdPartName,
          thirdPartKey: deposit.thirdPartKey,
        }),
    );

    const response = new GetAllPixDepositResponse({ ...results, data });

    this.logger.info('GetAll deposits response.', { deposits: response });

    return response;
  }
}
