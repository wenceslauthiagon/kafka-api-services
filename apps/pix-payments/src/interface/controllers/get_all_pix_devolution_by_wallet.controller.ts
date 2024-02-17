import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
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
  Failed,
} from '@zro/common';
import {
  PixDeposit,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import { PersonDocumentType, User } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import { GetAllPixDevolutionUseCase as UseCase } from '@zro/pix-payments/application';

export enum GetAllPixDevolutionByWalletRequestSort {
  CREATED_AT = 'created_at',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type DepositTxId = PixDeposit['txId'];
type DepositClientName = PixDeposit['clientName'];
type DepositClientPersonType = PixDeposit['clientPersonType'];
type DepositClientDocument = PixDeposit['clientDocument'];
type DepositClientAccountNumber = PixDeposit['clientAccountNumber'];
type DepositClientBranch = PixDeposit['clientBranch'];
type DepositClientBankName = PixDeposit['clientBank']['name'];
type DepositClientBankIspb = PixDeposit['clientBank']['ispb'];
type DepositThirdPartName = PixDeposit['thirdPartName'];
type DepositThirdPartPersonType = PixDeposit['thirdPartPersonType'];
type DepositThirdPartDocument = PixDeposit['thirdPartDocument'];
type DepositThirdPartAccountNumber = PixDeposit['thirdPartAccountNumber'];
type DepositThirdPartBranch = PixDeposit['thirdPartBranch'];
type DepositThirdPartBankName = PixDeposit['thirdPartBank']['name'];
type DepositThirdPartBankIspb = PixDeposit['thirdPartBank']['ispb'];

export type TGetAllPixDevolutionByWalletRequest = Pagination & {
  userId: UserId;
  walletId: WalletId;
  createdAtPeriodStart?: Date;
  createdAtPeriodEnd?: Date;
  endToEndId?: string;
  clientDocument?: string;
  states?: PixDevolutionState[];
};

export class GetAllPixDevolutionByWalletRequest
  extends PaginationRequest
  implements TGetAllPixDevolutionByWalletRequest
{
  @IsOptional()
  @Sort(GetAllPixDevolutionByWalletRequestSort)
  sort?: PaginationSort;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId!: WalletId;

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
  @IsEnum(PixDevolutionState, { each: true })
  states?: PixDevolutionState[];

  constructor(props: TGetAllPixDevolutionByWalletRequest) {
    super(props);
  }
}

type TGetAllPixDevolutionByWalletResponseItem = Pick<
  PixDevolution,
  | 'id'
  | 'amount'
  | 'description'
  | 'state'
  | 'createdAt'
  | 'failed'
  | 'endToEndId'
> & {
  userId: UserId;
  operationId: OperationId;
  depositTxId: DepositTxId;
  depositClientName: DepositClientName;
  depositClientPersonType: DepositClientPersonType;
  depositClientDocument: DepositClientDocument;
  depositClientAccountNumber: DepositClientAccountNumber;
  depositClientBranch: DepositClientBranch;
  depositClientBankName: DepositClientBankName;
  depositClientBankIspb: DepositClientBankIspb;
  depositThirdPartName: DepositThirdPartName;
  depositThirdPartPersonType: DepositThirdPartPersonType;
  depositThirdPartDocument: DepositThirdPartDocument;
  depositThirdPartAccountNumber: DepositThirdPartAccountNumber;
  depositThirdPartBranch: DepositThirdPartBranch;
  depositThirdPartBankName: DepositThirdPartBankName;
  depositThirdPartBankIspb: DepositThirdPartBankIspb;
};

export class GetAllPixDevolutionByWalletResponseItem
  extends AutoValidator
  implements TGetAllPixDevolutionByWalletResponseItem
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  operationId: OperationId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositTxId: DepositTxId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositClientName: DepositClientName;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  depositClientPersonType: DepositClientPersonType;

  @IsString()
  @Length(11, 14)
  depositClientDocument: DepositClientDocument;

  @IsString()
  @MaxLength(255)
  depositClientAccountNumber: DepositClientAccountNumber;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositClientBranch: DepositClientBranch;

  @IsString()
  @MaxLength(255)
  depositClientBankName: DepositClientBankName;

  @IsString()
  @MaxLength(255)
  depositClientBankIspb: DepositClientBankIspb;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositThirdPartName: DepositThirdPartName;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  depositThirdPartPersonType: DepositThirdPartPersonType;

  @IsString()
  @Length(11, 14)
  depositThirdPartDocument: DepositThirdPartDocument;

  @IsString()
  @MaxLength(255)
  depositThirdPartAccountNumber: DepositThirdPartAccountNumber;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositThirdPartBranch: DepositThirdPartBranch;

  @IsString()
  @MaxLength(255)
  depositThirdPartBankName: DepositThirdPartBankName;

  @IsString()
  @MaxLength(255)
  depositThirdPartBankIspb: DepositThirdPartBankIspb;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllPixDevolutionByWalletResponseItem) {
    super(props);
  }
}

export class GetAllPixDevolutionByWalletResponse extends PaginationResponse<GetAllPixDevolutionByWalletResponseItem> {}

export class GetAllPixDevolutionByWalletController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    devolutionRepository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({
      context: GetAllPixDevolutionByWalletController.name,
    });

    this.usecase = new UseCase(this.logger, devolutionRepository);
  }

  async execute(
    request: GetAllPixDevolutionByWalletRequest,
  ): Promise<GetAllPixDevolutionByWalletResponse> {
    this.logger.debug('GetAll Devolutions by wallet.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      walletId,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const wallet = new WalletEntity({ uuid: walletId });

    const results = await this.usecase.execute(
      pagination,
      null,
      wallet,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    );

    const data = results.data.map(
      (devolution) =>
        new GetAllPixDevolutionByWalletResponseItem({
          id: devolution.id,
          endToEndId: devolution.endToEndId,
          state: devolution.state,
          userId: devolution.user.uuid,
          amount: devolution.amount,
          description: devolution.description,
          failed: devolution.failed,
          createdAt: devolution.createdAt,
          depositTxId: devolution.deposit.txId,
          depositClientName: devolution.deposit.clientName,
          depositClientPersonType: devolution.deposit.clientPersonType,
          depositClientDocument: devolution.deposit.clientDocument,
          depositClientAccountNumber: devolution.deposit.clientAccountNumber,
          depositClientBranch: devolution.deposit.clientBranch,
          depositClientBankName: devolution.deposit.clientBank.name,
          depositClientBankIspb: devolution.deposit.clientBank.ispb,
          depositThirdPartName: devolution.deposit.thirdPartName,
          depositThirdPartPersonType: devolution.deposit.thirdPartPersonType,
          depositThirdPartDocument: devolution.deposit.thirdPartDocument,
          depositThirdPartAccountNumber:
            devolution.deposit.thirdPartAccountNumber,
          depositThirdPartBranch: devolution.deposit.thirdPartBranch,
          depositThirdPartBankName: devolution.deposit.thirdPartBank.name,
          depositThirdPartBankIspb: devolution.deposit.thirdPartBank.ispb,
          operationId: devolution.operation.id,
        }),
    );

    const response = new GetAllPixDevolutionByWalletResponse({
      ...results,
      data,
    });

    this.logger.info('GetAll devolutions by wallet response.', {
      devolutions: response,
    });

    return response;
  }
}
