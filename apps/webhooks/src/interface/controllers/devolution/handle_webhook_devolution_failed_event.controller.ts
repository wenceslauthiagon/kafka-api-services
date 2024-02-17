import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { PixDevolution, PixDevolutionEntity } from '@zro/pix-payments/domain';
import {
  HandleWebhookDevolutionFailedEventUseCase as UseCase,
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

type THandleWebhookDevolutionFailedEventRequest = Pick<PixDevolution, 'id'>;

export class HandleWebhookDevolutionFailedEventRequest
  extends AutoValidator
  implements THandleWebhookDevolutionFailedEventRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleWebhookDevolutionFailedEventRequest) {
    super(props);
  }
}

type THandleWebhookDevolutionFailedEventResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleWebhookDevolutionFailedEventResponse
  extends AutoValidator
  implements THandleWebhookDevolutionFailedEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookDevolutionFailedEventResponse) {
    super(props);
  }
}

export class HandleWebhookDevolutionFailedEventController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookRepository Webhook repository.
   * @param webhookEventRepository Webhook Event repository.
   * @param pixDevolutionFailedService PixPayment service.
   * @param eventEmitter WebhookEvent event emitter.
   */
  constructor(
    private logger: Logger,
    webhookRepository: WebhookRepository,
    webhookEventRepositoy: WebhookEventRepository,
    pixDevolutionFailedService: PixPaymentService,
    eventEmitter: WebhookEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleWebhookDevolutionFailedEventController.name,
    });

    const controllerEventEmitter = new WebhookEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      webhookRepository,
      webhookEventRepositoy,
      pixDevolutionFailedService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleWebhookDevolutionFailedEventRequest,
  ): Promise<HandleWebhookDevolutionFailedEventResponse> {
    this.logger.debug('Handle failed devolution event request.', { request });

    const { id } = request;

    const devolutionFailed = new PixDevolutionEntity({ id });

    const webhookEvent = await this.usecase.execute(devolutionFailed);

    if (!webhookEvent) return null;

    const response = new HandleWebhookDevolutionFailedEventResponse({
      id: webhookEvent.id,
      type: webhookEvent.type,
      state: webhookEvent.state,
    });

    this.logger.info('Handle failed devolution event response.', {
      webhookEvent: response,
    });

    return response;
  }
}
