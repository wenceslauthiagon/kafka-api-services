import { Logger } from 'winston';
import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  HandleFailedWebhookEventCreatedUseCase as UseCase,
  RetryService,
} from '@zro/webhooks/application';
import {
  WebhookEvent,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
  WebhookType,
} from '@zro/webhooks/domain';

type THandleFailedWebhookEventCreatedRequest = Pick<
  WebhookEvent,
  'id' | 'httpStatusCodeResponse'
>;

export class HandleFailedWebhookEventCreatedRequest
  extends AutoValidator
  implements THandleFailedWebhookEventCreatedRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  httpStatusCodeResponse: string;

  constructor(props: THandleFailedWebhookEventCreatedRequest) {
    super(props);
  }
}

type THandleFailedWebhookEventCreatedResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleFailedWebhookEventCreatedResponse
  extends AutoValidator
  implements THandleFailedWebhookEventCreatedResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleFailedWebhookEventCreatedResponse) {
    super(props);
  }
}

export class HandleFailedWebhookEventCreatedController {
  /**
   * HandleFailedr triggered when Webhook event was failed created.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookEventRepository Webhook Event repository.
   * @param webhookRepository Webhook repository.
   * @param retryService Retry service.
   * @param retryQueue Retry queue.
   * @param failedQueue Failed queue.
   * @param retryMinSeconds Retry min seconds.
   * @param retryMaxseconds Retry max seconds.
   */
  constructor(
    private logger: Logger,
    webhookEventRepository: WebhookEventRepository,
    webhookRepository: WebhookRepository,
    retryService: RetryService,
    retryQueue: string,
    failedQueue: string,
    retryMinSeconds: number,
    retryMaxseconds: number,
  ) {
    this.logger = logger.child({
      context: HandleFailedWebhookEventCreatedController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      webhookEventRepository,
      webhookRepository,
      retryService,
      retryQueue,
      failedQueue,
      retryMinSeconds,
      retryMaxseconds,
    );
  }

  async execute(
    request: HandleFailedWebhookEventCreatedRequest,
  ): Promise<HandleFailedWebhookEventCreatedResponse> {
    this.logger.debug('Handle Failed webhook event created request.', {
      request,
    });

    const { id, httpStatusCodeResponse } = request;

    const webhookEvent = new WebhookEventEntity({ id, httpStatusCodeResponse });

    const webhookEventUpdated = await this.usecase.execute(webhookEvent);

    if (!webhookEventUpdated) return null;

    const response = new HandleFailedWebhookEventCreatedResponse({
      id: webhookEventUpdated.id,
      type: webhookEventUpdated.type,
      state: webhookEventUpdated.state,
    });

    this.logger.info('Handle Failed webhook event created response.', {
      webhookEvent: response,
    });

    return response;
  }
}
