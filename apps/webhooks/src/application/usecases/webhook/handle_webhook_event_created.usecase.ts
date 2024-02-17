import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  WebhookEvent,
  WebhookEventRepository,
  WebhookEventState,
  WebhookType,
} from '@zro/webhooks/domain';
import {
  WebhookEventNotFoundException,
  WebhookEventEmitter,
  EncryptProvider,
  WebhookTargetGateway,
  WebhookTargetGatewayPixDevolutionReceivedRequest,
  WebhookTargetGatewayPaymentRequest,
  WebhookTargetGatewayDepositReceivedRequest,
  WebhookTargetGatewayPixDevolutionCompletedRequest,
  WebhookTargetGatewayPaymentFailedRequest,
  WebhookTargetGatewayPixDevolutionFailedRequest,
} from '@zro/webhooks/application';

export class HandleWebhookEventCreatedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookEventRepository Webhook Event repository.
   * @param webhoookTargetGateway Webhook target gateway.
   * @param encryptProvider Encrypt provider.
   * @param eventEmitter WebhookEvent event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly webhookEventRepository: WebhookEventRepository,
    private readonly webhoookTargetGateway: WebhookTargetGateway,
    private readonly encryptProvider: EncryptProvider,
    private readonly eventEmitter: WebhookEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleWebhookEventCreatedUseCase.name,
    });
  }

  /**
   * Handler triggered when webhook event is created.
   *
   * @param webhookEvent WebhookEvent created.
   * @returns {WebhookEvent} WebhookEvent created.
   */
  async execute(webhookEvent: WebhookEvent): Promise<WebhookEvent> {
    // Data input check
    if (!webhookEvent?.id) {
      throw new MissingDataException(['WebhookEvent ID']);
    }

    const webhookEventFound = await this.webhookEventRepository.getById(
      webhookEvent.id,
    );

    this.logger.debug('Webhook event found', { webhookEventFound });

    if (!webhookEventFound) {
      throw new WebhookEventNotFoundException(webhookEvent);
    }

    // Check indepotent
    if (webhookEventFound.state !== WebhookEventState.PENDING) {
      return webhookEventFound;
    }

    // Decrypt targetUrl, apiKey and data of webhook event
    const webhookTargetUrlDecrypted = this.encryptProvider.decrypt(
      webhookEventFound.targetUrl,
    );

    const webhookTargetApiKeyDecrypted = this.encryptProvider.decrypt(
      webhookEventFound.apiKey,
    );

    this.logger.debug('Webhook event decrypted informations');

    const webhookTargetGatewayMapper = {
      [WebhookType.PAYMENT_COMPLETED]: (
        targetUrl: string,
        apiKey: string,
        data: WebhookTargetGatewayPaymentRequest,
      ) =>
        this.webhoookTargetGateway.sendPaymentCompleted(
          targetUrl,
          apiKey,
          data,
        ),
      [WebhookType.DEPOSIT_RECEIVED]: (
        targetUrl: string,
        apiKey: string,
        data: WebhookTargetGatewayDepositReceivedRequest,
      ) =>
        this.webhoookTargetGateway.sendDepositReceived(targetUrl, apiKey, data),
      [WebhookType.DEVOLUTION_RECEIVED]: (
        targetUrl: string,
        apiKey: string,
        data: WebhookTargetGatewayPixDevolutionReceivedRequest,
      ) =>
        this.webhoookTargetGateway.sendDevolutionReceived(
          targetUrl,
          apiKey,
          data,
        ),
      [WebhookType.DEVOLUTION_COMPLETED]: (
        targetUrl: string,
        apiKey: string,
        data: WebhookTargetGatewayPixDevolutionCompletedRequest,
      ) =>
        this.webhoookTargetGateway.sendDevolutionCompleted(
          targetUrl,
          apiKey,
          data,
        ),
      [WebhookType.PAYMENT_FAILED]: (
        targetUrl: string,
        apiKey: string,
        data: WebhookTargetGatewayPaymentFailedRequest,
      ) =>
        this.webhoookTargetGateway.sendPaymentFailed(targetUrl, apiKey, data),
      [WebhookType.DEVOLUTION_FAILED]: (
        targetUrl: string,
        apiKey: string,
        data: WebhookTargetGatewayPixDevolutionFailedRequest,
      ) =>
        this.webhoookTargetGateway.sendDevolutionFailed(
          targetUrl,
          apiKey,
          data,
        ),
    };

    const response = await webhookTargetGatewayMapper[webhookEventFound.type](
      webhookTargetUrlDecrypted,
      webhookTargetApiKeyDecrypted,
      webhookEventFound.data as any,
    );

    const httpStatusCodeResponse = response.httpStatusCodeResponse;

    const webhookEventUpdated = await this.confirmWebhookEvent(
      webhookEventFound,
      httpStatusCodeResponse,
    );

    return webhookEventUpdated;
  }

  async confirmWebhookEvent(
    webhookEvent: WebhookEvent,
    httpStatusCodeResponse: string,
  ): Promise<WebhookEvent> {
    webhookEvent.httpStatusCodeResponse = httpStatusCodeResponse;
    webhookEvent.state = WebhookEventState.CONFIRMED;

    const webhookEventUpdated =
      await this.webhookEventRepository.update(webhookEvent);

    this.eventEmitter.confirmed(webhookEventUpdated);

    return webhookEventUpdated;
  }
}
