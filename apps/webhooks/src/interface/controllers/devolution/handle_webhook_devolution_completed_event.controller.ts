import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { PixDevolution, PixDevolutionEntity } from '@zro/pix-payments/domain';
import {
  HandleWebhookDevolutionCompletedEventUseCase as UseCase,
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

type THandleWebhookDevolutionCompletedEventRequest = Pick<PixDevolution, 'id'>;

export class HandleWebhookDevolutionCompletedEventRequest
  extends AutoValidator
  implements THandleWebhookDevolutionCompletedEventRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleWebhookDevolutionCompletedEventRequest) {
    super(props);
  }
}

type THandleWebhookDevolutionCompletedEventResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleWebhookDevolutionCompletedEventResponse
  extends AutoValidator
  implements THandleWebhookDevolutionCompletedEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookDevolutionCompletedEventResponse) {
    super(props);
  }
}

export class HandleWebhookDevolutionCompletedEventController {
  /**
   * Handler triggered when devolution completed was notified completion successfully.
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
    pixDevolutionCompletedService: PixPaymentService,
    eventEmitter: WebhookEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleWebhookDevolutionCompletedEventController.name,
    });

    const controllerEventEmitter = new WebhookEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      webhookRepository,
      webhookEventRepositoy,
      pixDevolutionCompletedService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleWebhookDevolutionCompletedEventRequest,
  ): Promise<HandleWebhookDevolutionCompletedEventResponse> {
    this.logger.debug('Handle completed event by ID request.', { request });

    const { id } = request;

    const devolution = new PixDevolutionEntity({ id });

    const webhookEvent = await this.usecase.execute(devolution);

    if (!webhookEvent) return null;

    const response = new HandleWebhookDevolutionCompletedEventResponse({
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
