import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
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
  DecodedQrCode,
  Payment,
  PaymentRepository,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import { PersonType, User } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import {
  BankingService,
  GetAllPaymentUseCase as UseCase,
} from '@zro/pix-payments/application';

export enum GetAllPaymentByWalletRequestSort {
  CREATED_AT = 'created_at',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

export type TGetAllPaymentByWalletRequest = Pagination & {
  userId: UserId;
  walletId: WalletId;
  states?: PaymentState[];
  paymentDatePeriodStart?: Date;
  paymentDatePeriodEnd?: Date;
  createdAtPeriodStart?: Date;
  createdAtPeriodEnd?: Date;
  endToEndId?: string;
  clientDocument?: string;
};

export class GetAllPaymentByWalletRequest
  extends PaginationRequest
  implements TGetAllPaymentByWalletRequest
{
  @IsUUID(4)
  userId!: UserId;

  @IsUUID(4)
  walletId!: WalletId;

  @IsOptional()
  @Sort(GetAllPaymentByWalletRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsEnum(PaymentState, { each: true })
  states?: PaymentState[];

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date paymentDatePeriodStart',
  })
  @IsDateBeforeThan('paymentDatePeriodEnd', false, {
    message: 'paymentDatePeriodStart must be before than paymentDatePeriodEnd',
  })
  paymentDatePeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date paymentDatePeriodEnd',
  })
  @IsDateAfterThan('paymentDatePeriodStart', false, {
    message: 'paymentDatePeriodEnd must be after than paymentDatePeriodStart',
  })
  paymentDatePeriodEnd?: Date;

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

  constructor(props: TGetAllPaymentByWalletRequest) {
    super(props);
  }
}

type OperationId = Operation['id'];

type TGetAllPaymentByWalletResponseItem = Pick<
  Payment,
  | 'id'
  | 'state'
  | 'value'
  | 'endToEndId'
  | 'decodedQrCode'
  | 'paymentDate'
  | 'description'
  | 'txId'
  | 'key'
  | 'transactionTag'
  | 'paymentType'
  | 'beneficiaryAccountType'
  | 'beneficiaryPersonType'
  | 'beneficiaryBranch'
  | 'beneficiaryAccountNumber'
  | 'beneficiaryBankName'
  | 'beneficiaryBankIspb'
  | 'beneficiaryDocument'
  | 'beneficiaryName'
  | 'ownerAccountNumber'
  | 'ownerBranch'
  | 'ownerDocument'
  | 'ownerPersonType'
  | 'ownerFullName'
  | 'createdAt'
  | 'updatedAt'
> & {
  operationId?: OperationId;
  userId?: UserId;
  ownerBankName: string;
  ownerBankIspb: string;
};

export class GetAllPaymentByWalletResponseItem
  extends AutoValidator
  implements TGetAllPaymentByWalletResponseItem
{
  @IsUUID(4)
  id!: string;

  @IsOptional()
  @IsUUID(4)
  operationId?: OperationId;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsInt()
  @Min(0)
  value: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId?: string;

  @IsOptional()
  @IsObject()
  decodedQrCode?: DecodedQrCode;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  key?: string;

  @IsString()
  @MaxLength(255)
  transactionTag: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsEnum(AccountType)
  beneficiaryAccountType: AccountType;

  @IsEnum(PersonType)
  beneficiaryPersonType: PersonType;

  @IsString()
  @MaxLength(255)
  beneficiaryBranch: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccountNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  beneficiaryBankName?: string;

  @IsString()
  @MaxLength(255)
  beneficiaryBankIspb: string;

  @IsString()
  @MaxLength(255)
  beneficiaryDocument: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  beneficiaryName?: string;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @MaxLength(255)
  ownerAccountNumber: string;

  @IsString()
  @MaxLength(255)
  ownerBranch: string;

  @IsString()
  @MaxLength(255)
  ownerDocument: string;

  @IsEnum(PersonType)
  ownerPersonType: PersonType;

  @IsString()
  @MaxLength(255)
  ownerFullName: string;

  @IsString()
  @MaxLength(255)
  ownerBankName: string;

  @IsString()
  @MaxLength(255)
  ownerBankIspb: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetAllPaymentByWalletResponseItem) {
    super(props);
  }
}

export class GetAllPaymentByWalletResponse extends PaginationResponse<GetAllPaymentByWalletResponseItem> {}

export class GetAllPaymentByWalletController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    bankingService: BankingService,
    ownerBankIspb: string,
  ) {
    this.logger = logger.child({
      context: GetAllPaymentByWalletController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      bankingService,
      ownerBankIspb,
    );
  }

  async execute(
    request: GetAllPaymentByWalletRequest,
  ): Promise<GetAllPaymentByWalletResponse> {
    this.logger.debug('GetAll Payments by wallet.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      walletId,
      states,
      paymentDatePeriodStart,
      paymentDatePeriodEnd,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const wallet = new WalletEntity({ uuid: walletId });

    const results = await this.usecase.execute(
      pagination,
      null,
      wallet,
      states,
      paymentDatePeriodStart,
      paymentDatePeriodEnd,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
    );

    const data = results.data.map(
      (payment) =>
        new GetAllPaymentByWalletResponseItem({
          id: payment.id,
          operationId: payment.operation?.id,
          state: payment.state,
          value: payment.value,
          endToEndId: payment.endToEndId,
          decodedQrCode: payment.decodedQrCode,
          paymentDate: payment.paymentDate,
          description: payment.description,
          txId: payment.txId,
          key: payment.key,
          transactionTag: payment.transactionTag,
          paymentType: payment.paymentType,
          beneficiaryAccountType: payment.beneficiaryAccountType,
          beneficiaryPersonType: payment.beneficiaryPersonType,
          beneficiaryBranch: payment.beneficiaryBranch,
          beneficiaryAccountNumber: payment.beneficiaryAccountNumber,
          beneficiaryBankName: payment.beneficiaryBankName,
          beneficiaryBankIspb: payment.beneficiaryBankIspb,
          beneficiaryDocument: payment.beneficiaryDocument,
          beneficiaryName: payment.beneficiaryName,
          userId: payment.user.uuid,
          ownerAccountNumber: payment.ownerAccountNumber,
          ownerBranch: payment.ownerBranch,
          ownerDocument: payment.ownerDocument,
          ownerPersonType: payment.ownerPersonType,
          ownerFullName: payment.ownerFullName,
          ownerBankName: payment.ownerBankName,
          ownerBankIspb: payment.ownerBankIspb,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        }),
    );

    const response = new GetAllPaymentByWalletResponse({ ...results, data });

    this.logger.info('GetAll payments by wallet response.', {
      payments: response,
    });

    return response;
  }
}
