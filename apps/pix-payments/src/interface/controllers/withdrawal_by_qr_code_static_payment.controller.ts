import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  SanitizeHtml,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import {
  Payment,
  PaymentEntity,
  PaymentRepository,
  PaymentState,
  TPaymentRequestQrCode,
  DecodedQrCodeRepository,
  DecodedQrCodeEntity,
  DecodedQrCode,
} from '@zro/pix-payments/domain';
import {
  WithdrawalByQrCodeStaticPaymentUseCase as UseCase,
  UserService,
  OperationService,
  BankingService,
} from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type DecodedQrCodeId = DecodedQrCode['id'];

export class WithdrawalByQrCodeStaticPaymentRequest
  implements TPaymentRequestQrCode
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId!: UserId;

  @IsUUID(4)
  walletId!: WalletId;

  @IsUUID(4)
  decodedQrCodeId!: DecodedQrCodeId;

  @IsOptional()
  @IsInt()
  @IsPositive()
  value?: number;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  constructor(props: TPaymentRequestQrCode) {
    Object.assign(this, props);
  }
}

type TWithdrawalByQrCodeStaticPaymentResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt' | 'value' | 'description' | 'paymentDate'
> & { operationId?: OperationId };

export class WithdrawalByQrCodeStaticPaymentResponse
  extends AutoValidator
  implements TWithdrawalByQrCodeStaticPaymentResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  operationId?: OperationId;

  @IsInt()
  value: number;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TWithdrawalByQrCodeStaticPaymentResponse) {
    super(props);
  }
}

export class WithdrawalByQrCodeStaticPaymentController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    decodedQrCodeRepository: DecodedQrCodeRepository,
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
    userService: UserService,
    operationService: OperationService,
    bankingService: BankingService,
    private pixPaymentOperationCurrencyTag: string,
    private pixPaymentOperationWithdrawalTransactionTag: string,
    private pixPaymentAgentModWithdrawal: string,
  ) {
    this.logger = logger.child({
      context: WithdrawalByQrCodeStaticPaymentController.name,
    });

    const eventEmitter = new PaymentEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      bankingService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationWithdrawalTransactionTag,
      this.pixPaymentAgentModWithdrawal,
    );
  }

  async execute(
    request: WithdrawalByQrCodeStaticPaymentRequest,
  ): Promise<WithdrawalByQrCodeStaticPaymentResponse> {
    this.logger.debug('Withdrawal qr code static Pix Payment request.', {
      request,
    });

    const user = new UserEntity({ uuid: request.userId });
    const wallet = new WalletEntity({ uuid: request.walletId });
    const payload = new PaymentEntity(request);
    payload.decodedQrCode = new DecodedQrCodeEntity({
      id: request.decodedQrCodeId,
    });

    const payment = await this.usecase.execute(user, wallet, payload);

    if (!payment) return null;

    const response = new WithdrawalByQrCodeStaticPaymentResponse({
      id: payment.id,
      operationId: payment.operation?.id,
      state: payment.state,
      value: payment.value,
      paymentDate: payment.paymentDate,
      description: payment.description,
      createdAt: payment.createdAt,
    });

    this.logger.info('Withdrawal qr code static Pix Payment response.', {
      payment: response,
    });

    return response;
  }
}
