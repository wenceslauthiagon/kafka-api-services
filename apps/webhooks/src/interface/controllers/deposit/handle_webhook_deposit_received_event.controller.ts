import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { PixDeposit, PixDepositEntity } from '@zro/pix-payments/domain';
import {
  HandleWebhookDepositReceivedEventUseCase as UseCase,
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

type THandleWebhookDepositReceivedEventRequest = Pick<PixDeposit, 'id'> & {
  userId: string;
};

export class HandleWebhookDepositReceivedEventRequest
  extends AutoValidator
  implements THandleWebhookDepositReceivedEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  constructor(props: THandleWebhookDepositReceivedEventRequest) {
    super(props);
  }
}

type THandleWebhookDepositReceivedEventResponse = Pick<
  WebhookEvent,
  'id' | 'type' | 'state'
>;

export class HandleWebhookDepositReceivedEventResponse
  extends AutoValidator
  implements THandleWebhookDepositReceivedEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookType)
  type: WebhookType;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: THandleWebhookDepositReceivedEventResponse) {
    super(props);
  }
}

export class HandleWebhookDepositReceivedEventController {
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
      context: HandleWebhookDepositReceivedEventController.name,
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
    request: HandleWebhookDepositReceivedEventRequest,
  ): Promise<HandleWebhookDepositReceivedEventResponse> {
    this.logger.debug('Handle completed event by ID request.', { request });

    const { id, userId } = request;

    const pixDepositUser = new UserEntity({ uuid: userId });

    const pixDepositReceived = new PixDepositEntity({
      id,
      user: pixDepositUser,
    });

    const webhookEvent = await this.usecase.execute(pixDepositReceived);

    if (!webhookEvent) return null;

    const response = new HandleWebhookDepositReceivedEventResponse({
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
