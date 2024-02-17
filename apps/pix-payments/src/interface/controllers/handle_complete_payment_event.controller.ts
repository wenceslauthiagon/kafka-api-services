import { Logger } from 'winston';
import {
  IsEnum,
  IsUUID,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import {
  HandleCompletePaymentEventUseCase as UseCase,
  OperationService,
  PaymentEvent,
} from '@zro/pix-payments/application';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleCompletePaymentEventRequest = Pick<
  PaymentEvent,
  'id' | 'state' | 'endToEndId'
> & { userId: UserId; walletId: WalletId };

export class HandleCompletePaymentEventRequest
  extends AutoValidator
  implements THandleCompletePaymentEventRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId?: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: THandleCompletePaymentEventRequest) {
    super(props);
  }
}

type THandleCompletePaymentEventResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt'
>;

export class HandleCompletePaymentEventResponse
  extends AutoValidator
  implements THandleCompletePaymentEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCompletePaymentEventResponse) {
    super(props);
  }
}

export class HandleCompletePaymentEventController {
  /**
   * Handler triggered when Payment was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param paymentRepository Payment repository.
   * @param eventEmitter Payment event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    eventEmitter: PaymentEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleCompletePaymentEventController.name,
    });

    const controllerEventEmitter = new PaymentEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: HandleCompletePaymentEventRequest,
  ): Promise<HandleCompletePaymentEventResponse> {
    this.logger.debug('Handle complete event by ID request.', { request });

    const { id, endToEndId } = request;

    const payment = await this.usecase.execute(id, endToEndId);

    if (!payment) return null;

    const response = new HandleCompletePaymentEventResponse({
      id: payment.id,
      state: payment.state,
      createdAt: payment.createdAt,
    });

    this.logger.info('Handle complete event by ID response.', {
      payment: response,
    });

    return response;
  }
}
