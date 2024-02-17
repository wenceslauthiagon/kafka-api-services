import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Payment, PaymentEntity } from '@zro/pix-payments/domain';
import {
  HandleWebhookPaymentFailedEventUseCase as UseCase,
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

type THandleWebhookPaymentFailedEventRequest = Pick<Payment, 'id'>;

export class HandleWebhookPaymentFailedEventRequest
  extends AutoValidator
  implements THandleWebhookPaymentFailedEventRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleWebhookPaymentFailedEventRequest) {
    super(props);
  }
}

type THandleWebhookPaymentFailedEventResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleWebhookPaymentFailedEventResponse
  extends AutoValidator
  implements THandleWebhookPaymentFailedEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookPaymentFailedEventResponse) {
    super(props);
  }
}

export class HandleWebhookPaymentFailedEventController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookRepository Webhook repository.
   * @param webhookEventRepository Webhook Event repository.
   * @param pixPaymentService PixPayment service.
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
      context: HandleWebhookPaymentFailedEventController.name,
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
    request: HandleWebhookPaymentFailedEventRequest,
  ): Promise<HandleWebhookPaymentFailedEventResponse> {
    this.logger.debug('Handle failed payment request.', { request });

    const { id } = request;

    const payment = new PaymentEntity({ id });

    const webhookEvent = await this.usecase.execute(payment);

    if (!webhookEvent) return null;

    const response = new HandleWebhookPaymentFailedEventResponse({
      id: webhookEvent.id,
      type: webhookEvent.type,
      state: webhookEvent.state,
    });

    this.logger.info('Handle failed payment response.', {
      webhookEvent: response,
    });

    return response;
  }
}
