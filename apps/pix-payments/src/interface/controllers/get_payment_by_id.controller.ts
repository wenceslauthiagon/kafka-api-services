import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  Min,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import { PersonType, User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import {
  AccountType,
  Payment,
  PaymentRepository,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import { GetPaymentByIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TGetPaymentByIdRequest = Pick<Payment, 'id'> & {
  userId?: UserId;
  walletId?: WalletId;
};

export class GetPaymentByIdRequest
  extends AutoValidator
  implements TGetPaymentByIdRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  constructor(props: TGetPaymentByIdRequest) {
    super(props);
  }
}

type OperationId = Operation['id'];

type TGetPaymentByIdResponse = Pick<
  Payment,
  | 'id'
  | 'endToEndId'
  | 'txId'
  | 'paymentType'
  | 'ownerFullName'
  | 'ownerPersonType'
  | 'ownerDocument'
  | 'ownerAccountNumber'
  | 'ownerBranch'
  | 'beneficiaryName'
  | 'beneficiaryPersonType'
  | 'beneficiaryDocument'
  | 'beneficiaryAccountNumber'
  | 'beneficiaryBranch'
  | 'beneficiaryBankName'
  | 'beneficiaryBankIspb'
  | 'beneficiaryAccountType'
  | 'value'
  | 'description'
  | 'state'
  | 'createdAt'
  | 'paymentDate'
  | 'failed'
> & { userId: UserId; walletId: WalletId; operationId?: OperationId };

export class GetPaymentByIdResponse
  extends AutoValidator
  implements TGetPaymentByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
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

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsEnum(AccountType)
  beneficiaryAccountType: AccountType;

  @IsEnum(PersonType)
  beneficiaryPersonType: PersonType;

  @IsString()
  beneficiaryAccountNumber: string;

  @IsString()
  @MaxLength(255)
  beneficiaryBranch: string;

  @IsString()
  @IsOptional()
  beneficiaryBankName?: string;

  @IsString()
  @MaxLength(255)
  ownerFullName: string;

  @IsEnum(PersonType)
  ownerPersonType: PersonType;

  @IsString()
  @MaxLength(255)
  ownerDocument: string;

  @IsString()
  @MaxLength(255)
  ownerAccountNumber: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsString()
  @MaxLength(255)
  ownerBranch: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  beneficiaryName?: string;

  @IsString()
  @MaxLength(255)
  beneficiaryDocument: string;

  @IsString()
  @MaxLength(255)
  beneficiaryBankIspb: string;

  @IsObject()
  @IsOptional()
  failed?: Failed;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetPaymentByIdResponse) {
    super(props);
  }
}

export class GetPaymentByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
  ) {
    this.logger = logger.child({ context: GetPaymentByIdController.name });

    this.usecase = new UseCase(this.logger, paymentRepository);
  }

  async execute(
    request: GetPaymentByIdRequest,
  ): Promise<GetPaymentByIdResponse> {
    this.logger.debug('Get Pix Payment by id request.', { request });

    const { id, userId, walletId } = request;

    const wallet = walletId && new WalletEntity({ uuid: walletId });
    const user = userId && new UserEntity({ uuid: userId });

    const payment = await this.usecase.execute(id, user, wallet);

    if (!payment) return null;

    const response = new GetPaymentByIdResponse({
      id: payment.id,
      endToEndId: payment.endToEndId,
      txId: payment.txId,
      value: payment.value,
      paymentType: payment.paymentType,
      ownerFullName: payment.ownerFullName,
      ownerPersonType: payment.ownerPersonType,
      ownerDocument: payment.ownerDocument,
      ownerAccountNumber: payment.ownerAccountNumber,
      ownerBranch: payment.ownerBranch,
      beneficiaryName: payment.beneficiaryName,
      beneficiaryPersonType: payment.beneficiaryPersonType,
      beneficiaryDocument: payment.beneficiaryDocument,
      beneficiaryAccountNumber: payment.beneficiaryAccountNumber,
      beneficiaryBranch: payment.beneficiaryBranch,
      beneficiaryBankName: payment.beneficiaryBankName,
      beneficiaryBankIspb: payment.beneficiaryBankIspb,
      beneficiaryAccountType: payment.beneficiaryAccountType,
      operationId: payment.operation?.id,
      state: payment.state,
      paymentDate: payment.paymentDate,
      description: payment.description,
      failed: payment.failed,
      createdAt: payment.createdAt,
      userId: payment.user.uuid,
      walletId: payment.wallet.uuid,
    });

    this.logger.info('Get Pix Payment by id response.', { payment: response });

    return response;
  }
}
