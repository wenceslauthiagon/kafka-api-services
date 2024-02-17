import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Payment, PaymentEntity } from '@zro/pix-payments/domain';
import {
  HandleWebhookPaymentCompletedEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/webhooks/application';
import {
  WebhookEvent,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
  WebhookType,
} from '@zro/webhooks/domain';
import {
  WebhookEventEmitterController,
  WebhookEventEmitterControllerInterface,
} from '@zro/webhooks/interface';

type THandleWebhookPaymentCompletedEventRequest = Pick<Payment, 'id'>;

export class HandleWebhookPaymentCompletedEventRequest
  extends AutoValidator
  implements THandleWebhookPaymentCompletedEventRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleWebhookPaymentCompletedEventRequest) {
    super(props);
  }
}

type THandleWebhookPaymentCompletedEventResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleWebhookPaymentCompletedEventResponse
  extends AutoValidator
  implements THandleWebhookPaymentCompletedEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookPaymentCompletedEventResponse) {
    super(props);
  }
}

export class HandleWebhookPaymentCompletedEventController {
  /**
   * Handler triggered when Payment was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookRepository Webhook repository.
   * @param webhookEventRepository Webhook Event repository.
   * @param pixPaymentService PixPayment service.
   * @param encryptProvider Encrypt provider.
   * @param eventEmitter WebhookEvent event emitter.
   */
  constructor(
    private logger: Logger,
    webhookRepository: WebhookRepository,
    webhookEventRepositoy: WebhookEventRepository,
    pixPaymentService: PixPaymentService,
    eventEmitter: WebhookEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleWebhookPaymentCompletedEventController.name,
    });

    const controllerEventEmitter = new WebhookEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      webhookRepository,
      webhookEventRepositoy,
      pixPaymentService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleWebhookPaymentCompletedEventRequest,
  ): Promise<HandleWebhookPaymentCompletedEventResponse> {
    this.logger.debug('Handle completed event by ID request.', { request });

    const { id } = request;

    const payment = new PaymentEntity({ id });

    const webhookEvent = await this.usecase.execute(payment);

    if (!webhookEvent) return null;

    const response = new HandleWebhookPaymentCompletedEventResponse({
      id: webhookEvent.id,
      type: webhookEvent.type,
      state: webhookEvent.state,
    });

    this.logger.info('Handle completed event by ID response.', {
      webhookEvent: response,
    });

    return response;
  }
}
