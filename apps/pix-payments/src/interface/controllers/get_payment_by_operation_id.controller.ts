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
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  AccountType,
  DecodedPixAccountRepository,
  DecodedQrCodeRepository,
  Payment,
  PaymentRepository,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import { GetPaymentByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TGetPaymentByOperationIdRequest = {
  operationId: OperationId;
  userId?: UserId;
  walletId?: WalletId;
};

export class GetPaymentByOperationIdRequest
  extends AutoValidator
  implements TGetPaymentByOperationIdRequest
{
  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TGetPaymentByOperationIdRequest) {
    super(props);
  }
}

type TGetPaymentByOperationIdResponse = Pick<
  Payment,
  | 'id'
  | 'state'
  | 'value'
  | 'endToEndId'
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
  | 'ownerFullName'
  | 'ownerPersonType'
  | 'failed'
  | 'createdAt'
  | 'updatedAt'
> & {
  operationId?: OperationId;
  userId: UserId;
};

export class GetPaymentByOperationIdResponse
  extends AutoValidator
  implements TGetPaymentByOperationIdResponse
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
  @Length(8, 8)
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

  @IsObject()
  @IsOptional()
  failed?: Failed;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetPaymentByOperationIdResponse) {
    super(props);
  }
}

export class GetPaymentByOperationIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    decodedQrCodeRepository: DecodedQrCodeRepository,
    decodedPixAccountRepository: DecodedPixAccountRepository,
  ) {
    this.logger = logger.child({
      context: GetPaymentByOperationIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      decodedQrCodeRepository,
      decodedPixAccountRepository,
    );
  }

  async execute(
    request: GetPaymentByOperationIdRequest,
  ): Promise<GetPaymentByOperationIdResponse> {
    this.logger.debug('Get Pix Payment by operation id request.', { request });

    const { operationId, userId, walletId } = request;

    const wallet = walletId && new WalletEntity({ uuid: walletId });
    const user = userId && new UserEntity({ uuid: userId });
    const operation = new OperationEntity({ id: operationId });

    const payment = await this.usecase.execute(operation, user, wallet);

    if (!payment) return null;

    const response = new GetPaymentByOperationIdResponse({
      id: payment.id,
      operationId: payment.operation.id,
      state: payment.state,
      value: payment.value,
      endToEndId: payment.endToEndId,
      paymentDate: payment.paymentDate,
      description: payment.description,
      failed: payment.failed,
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
      ownerAccountNumber: payment.ownerAccountNumber,
      ownerBranch: payment.ownerBranch,
      ownerDocument: payment.ownerDocument,
      ownerFullName: payment.ownerFullName,
      ownerPersonType: payment.ownerPersonType,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      userId: payment.user.uuid,
    });

    this.logger.info('Get Pix Payment by operation id response.', {
      payment: response,
    });

    return response;
  }
}
