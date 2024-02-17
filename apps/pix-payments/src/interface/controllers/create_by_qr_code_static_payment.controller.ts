import { Logger } from 'winston';
import { IsEnum, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat, MaxValue } from '@zro/common';
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
  CreateByQrCodeStaticPaymentUseCase as UseCase,
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

export class CreateByQrCodeStaticPaymentRequest
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
  @IsInt()
  @IsPositive()
  @MaxValue(1e18)
  value?: number;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  constructor(props: TPaymentRequestQrCode) {
    super(props);
  }
}

type TCreateByQrCodeStaticPaymentResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt' | 'value' | 'paymentDate'
> & { operationId?: OperationId };

export class CreateByQrCodeStaticPaymentResponse
  extends AutoValidator
  implements TCreateByQrCodeStaticPaymentResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  operationId?: OperationId;

  @IsInt()
  value: number;

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

  constructor(props: TCreateByQrCodeStaticPaymentResponse) {
    super(props);
  }
}

export class CreateByQrCodeStaticPaymentController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    decodedQrCodeRepository: DecodedQrCodeRepository,
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
    userService: UserService,
    operationService: OperationService,
    private pixPaymentOperationCurrencyTag: string,
    private pixPaymentOperationSendQrsTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: CreateByQrCodeStaticPaymentController.name,
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
      this.pixPaymentOperationSendQrsTransactionTag,
    );
  }

  async execute(
    request: CreateByQrCodeStaticPaymentRequest,
  ): Promise<CreateByQrCodeStaticPaymentResponse> {
    this.logger.debug('Create qr code static Pix Payment request.', {
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

    const response = new CreateByQrCodeStaticPaymentResponse({
      id: payment.id,
      operationId: payment.operation?.id,
      state: payment.state,
      value: payment.value,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt,
    });

    this.logger.info('Create qr code static Pix Payment response.', {
      payment: response,
    });

    return response;
  }
}
