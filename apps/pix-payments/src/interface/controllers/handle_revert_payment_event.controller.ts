import { Logger } from 'winston';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  HandleRevertPaymentEventUseCase as UseCase,
  OperationService,
  PaymentEvent,
} from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleRevertPaymentEventRequest = Pick<
  PaymentEvent,
  'id' | 'state' | 'chargebackReason' | 'failed'
> & { userId: UserId; walletId: WalletId };

export class HandleRevertPaymentEventRequest
  extends AutoValidator
  implements THandleRevertPaymentEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  chargebackReason?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: THandleRevertPaymentEventRequest) {
    super(props);
  }
}

type THandleRevertPaymentEventResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt'
>;

export class HandleRevertPaymentEventResponse
  extends AutoValidator
  implements THandleRevertPaymentEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleRevertPaymentEventResponse) {
    super(props);
  }
}

export class HandleRevertPaymentEventController {
  /**
   * Handler triggered when an revert is thrown.
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
      context: HandleRevertPaymentEventController.name,
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
    request: HandleRevertPaymentEventRequest,
  ): Promise<HandleRevertPaymentEventResponse> {
    this.logger.debug('Handle revert event by ID request.', { request });

    const { id, chargebackReason, failed } = request;

    const payment = await this.usecase.execute(id, chargebackReason, failed);

    if (!payment) return null;

    const response = new HandleRevertPaymentEventResponse({
      id: payment.id,
      state: payment.state,
      createdAt: payment.createdAt,
    });

    this.logger.info('Handle revert event by ID response.', {
      payment: response,
    });

    return response;
  }
}
