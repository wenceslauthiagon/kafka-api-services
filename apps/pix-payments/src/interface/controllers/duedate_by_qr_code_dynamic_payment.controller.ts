import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
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
  DuedateByQrCodeDynamicPaymentUseCase as UseCase,
  UserService,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type DecodedQrCodeId = DecodedQrCode['id'];

export class DuedateByQrCodeDynamicPaymentRequest
  extends AutoValidator
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
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  constructor(props: TPaymentRequestQrCode) {
    super(props);
  }
}

type TDuedateByQrCodeDynamicPaymentResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt' | 'value' | 'description' | 'paymentDate'
> & { operationId?: OperationId };

export class DuedateByQrCodeDynamicPaymentResponse
  extends AutoValidator
  implements TDuedateByQrCodeDynamicPaymentResponse
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

  constructor(props: TDuedateByQrCodeDynamicPaymentResponse) {
    super(props);
  }
}

export class DuedateByQrCodeDynamicPaymentController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    decodedQrCodeRepository: DecodedQrCodeRepository,
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
    userService: UserService,
    operationService: OperationService,
    private pixPaymentOperationCurrencyTag: string,
    private pixPaymentOperationDuedateTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: DuedateByQrCodeDynamicPaymentController.name,
    });

    const eventEmitter = new PaymentEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationDuedateTransactionTag,
    );
  }

  async execute(
    request: DuedateByQrCodeDynamicPaymentRequest,
  ): Promise<DuedateByQrCodeDynamicPaymentResponse> {
    this.logger.debug('Duedate qr code dynamic Pix Payment request.', {
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

    const response = new DuedateByQrCodeDynamicPaymentResponse({
      id: payment.id,
      operationId: payment.operation?.id,
      state: payment.state,
      value: payment.value,
      paymentDate: payment.paymentDate,
      description: payment.description,
      createdAt: payment.createdAt,
    });

    this.logger.info('Duedate qr code dynamic Pix Payment response.', {
      payment: response,
    });

    return response;
  }
}
