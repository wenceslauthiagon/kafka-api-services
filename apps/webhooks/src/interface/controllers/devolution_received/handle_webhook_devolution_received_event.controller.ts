import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixDevolutionReceived,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import {
  HandleWebhookDevolutionReceivedEventUseCase as UseCase,
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

type THandleWebhookDevolutionReceivedEventRequest = Pick<
  PixDevolutionReceived,
  'id'
>;

export class HandleWebhookDevolutionReceivedEventRequest
  extends AutoValidator
  implements THandleWebhookDevolutionReceivedEventRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleWebhookDevolutionReceivedEventRequest) {
    super(props);
  }
}

type THandleWebhookDevolutionReceivedEventResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleWebhookDevolutionReceivedEventResponse
  extends AutoValidator
  implements THandleWebhookDevolutionReceivedEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookDevolutionReceivedEventResponse) {
    super(props);
  }
}

export class HandleWebhookDevolutionReceivedEventController {
  /**
   * Handler triggered when DevolutionReceived was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookRepository Webhook repository.
   * @param webhookEventRepository Webhook Event repository.
   * @param pixPaymentService PixPayment service.
   * @param encryptProvider Encrypt provider.
   * @param eventEmitter WebhookEvent event emitter.s
   */
  constructor(
    private logger: Logger,
    webhookRepository: WebhookRepository,
    webhookEventRepositoy: WebhookEventRepository,
    pixDevolutionReceivedService: PixPaymentService,
    eventEmitter: WebhookEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleWebhookDevolutionReceivedEventController.name,
    });

    const controllerEventEmitter = new WebhookEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      webhookRepository,
      webhookEventRepositoy,
      pixDevolutionReceivedService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleWebhookDevolutionReceivedEventRequest,
  ): Promise<HandleWebhookDevolutionReceivedEventResponse> {
    this.logger.debug('Handle completed event by ID request.', { request });

    const { id } = request;

    const devolutionReceived = new PixDevolutionReceivedEntity({ id });

    const webhookEvent = await this.usecase.execute(devolutionReceived);

    if (!webhookEvent) return null;

    const response = new HandleWebhookDevolutionReceivedEventResponse({
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
