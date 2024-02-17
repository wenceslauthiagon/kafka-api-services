import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  HandleWebhookEventCreatedUseCase as UseCase,
  WebhookEventPayload,
  WebhookTargetGateway,
} from '@zro/webhooks/application';
import {
  WebhookEvent,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookType,
} from '@zro/webhooks/domain';
import { EncryptProvider } from '@zro/notifications/application';
import {
  WebhookEventEmitterController,
  WebhookEventEmitterControllerInterface,
} from '@zro/webhooks/interface';

type THandleWebhookEventCreatedRequest = WebhookEventPayload;

export class HandleWebhookEventCreatedRequest
  extends AutoValidator
  implements THandleWebhookEventCreatedRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookEventCreatedRequest) {
    super(props);
  }
}

type THandleWebhookEventCreatedResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleWebhookEventCreatedResponse
  extends AutoValidator
  implements THandleWebhookEventCreatedResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookEventCreatedResponse) {
    super(props);
  }
}

export class HandleWebhookEventCreatedController {
  /**
   * Handler triggered when Webhook event was created.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookEventRepository Webhook Event repository.
   * @param webhookTargetGateway Webhook target gateway.
   * @param encryptProvider Encrypt provider.
   * @param eventEmitter WebhookEvent event emitter.
   */
  constructor(
    private logger: Logger,
    webhookEventRepositoy: WebhookEventRepository,
    webhookTargetGateway: WebhookTargetGateway,
    encryptProvider: EncryptProvider,
    eventEmitter: WebhookEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleWebhookEventCreatedController.name,
    });

    const controllerEventEmitter = new WebhookEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      webhookEventRepositoy,
      webhookTargetGateway,
      encryptProvider,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleWebhookEventCreatedRequest,
  ): Promise<HandleWebhookEventCreatedResponse> {
    this.logger.debug('Handle webhook event created request.', { request });

    const { id } = request;

    const webhookEvent = new WebhookEventEntity({ id });

    const webhookEventUpdated = await this.usecase.execute(webhookEvent);

    if (!webhookEventUpdated) return null;

    const response = new HandleWebhookEventCreatedResponse({
      id: webhookEventUpdated.id,
      type: webhookEventUpdated.type,
      state: webhookEventUpdated.state,
    });

    this.logger.info('Handle webhook event created response.', {
      webhookEvent: response,
    });

    return response;
  }
}
