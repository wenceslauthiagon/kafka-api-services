import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import {
  HandlePendingPaymentEventUseCase as UseCase,
  OperationService,
  BankingService,
  PaymentEvent,
  PixPaymentGateway,
} from '@zro/pix-payments/application';
import {
  Payment,
  PaymentRepository,
  PaymentState,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
  PixDepositEventEmitterControllerInterface,
  PixDepositEventEmitterController,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandlePendingPaymentEventRequest = Pick<PaymentEvent, 'id' | 'state'> & {
  userId: UserId;
  walletId: WalletId;
};

export class HandlePendingPaymentEventRequest
  extends AutoValidator
  implements THandlePendingPaymentEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: THandlePendingPaymentEventRequest) {
    super(props);
  }
}

type THandlePendingPaymentEventResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingPaymentEventResponse
  extends AutoValidator
  implements THandlePendingPaymentEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandlePendingPaymentEventResponse) {
    super(props);
  }
}

export class HandlePendingPaymentEventController {
  /**
   * Handler triggered when Payment was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param paymentRepository Payment repository.
   * @param depositRepository Deposit repository.
   * @param paymentServiceEventEmitter Payment event emitter.
   * @param pspGateway Payment psp gateway.
   * @param operationService Operation service.
   * @param bankingService Banking service.
   * @param depositServiceEventEmitter Deposit event emitter.
   */
  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    depositRepository: PixDepositRepository,
    paymentServiceEventEmitter: PaymentEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    operationService: OperationService,
    bankingService: BankingService,
    depositServiceEventEmitter: PixDepositEventEmitterControllerInterface,
    pixPaymentOperationCurrencyTag: string,
    pixPaymentOperationDescription: string,
    pixPaymentOperationNewPixReceivedTransactionTag: string,
    pixPaymentZroBankIspb: string,
    pixPaymentOperationChangeTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingPaymentEventController.name,
    });

    const paymentEventEmitter = new PaymentEventEmitterController(
      paymentServiceEventEmitter,
    );
    const depositEventEmitter = new PixDepositEventEmitterController(
      depositServiceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      depositRepository,
      pspGateway,
      paymentEventEmitter,
      operationService,
      bankingService,
      depositEventEmitter,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationDescription,
      pixPaymentOperationNewPixReceivedTransactionTag,
      pixPaymentZroBankIspb,
      pixPaymentOperationChangeTransactionTag,
    );
  }

  async execute(
    request: HandlePendingPaymentEventRequest,
  ): Promise<HandlePendingPaymentEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const payment = await this.usecase.execute(id);

    if (!payment) return null;

    const response = new HandlePendingPaymentEventResponse({
      id: payment.id,
      state: payment.state,
      createdAt: payment.createdAt,
    });

    this.logger.info('Handle pending event by ID response.', {
      payment: response,
    });

    return response;
  }
}
