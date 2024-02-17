import { Logger } from 'winston';
import { MissingDataException, getMoment } from '@zro/common';
import { RetryEntity } from '@zro/utils/domain';
import {
  WebhookEvent,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
} from '@zro/webhooks/domain';
import {
  WebhookEventNotFoundException,
  WebhookEventInvalidStateException,
  RetryService,
  WebhookNotFoundException,
} from '@zro/webhooks/application';

export class HandleFailedWebhookEventCreatedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookEventRepository Webhook Event repository.
   * @param webhookRepository Webhook repository.
   * @param retryService Retry service.
   * @param retryQueue Retry queue.
   * @param failedQueue Failed queue.
   * @param RETRY_MIN_SECONDS Retry min seconds.
   * @param RETRY_MAX_SECONDS Retry max seconds.

   */
  constructor(
    private logger: Logger,
    private readonly webhookEventRepository: WebhookEventRepository,
    private readonly webhookRepository: WebhookRepository,
    private readonly retryService: RetryService,
    private readonly retryQueue: string,
    private readonly failedQueue: string,
    private readonly RETRY_MIN_SECONDS: number,
    private readonly RETRY_MAX_SECONDS: number,
  ) {
    this.logger = logger.child({
      context: HandleFailedWebhookEventCreatedUseCase.name,
    });
  }

  /**
   * Handle Failed triggered when webhook event is created is failed.
   *
   * @param {WebhookEvent} WebhookEvent WebhookEvent created failed.
   * @returns {WebhookEvent} WebhookEvent created.
   */
  async execute(webhookEvent: WebhookEvent): Promise<WebhookEvent> {
    // Data input check
    if (!webhookEvent?.id || !webhookEvent?.httpStatusCodeResponse) {
      throw new MissingDataException([
        ...(!webhookEvent?.id ? ['WebhookEvent ID'] : []),
        ...(!webhookEvent?.httpStatusCodeResponse
          ? ['WebhookEvent HttpStatusCodeResponse']
          : []),
      ]);
    }

    const webhookEventFound = await this.webhookEventRepository.getById(
      webhookEvent.id,
    );

    if (!webhookEventFound) {
      throw new WebhookEventNotFoundException(webhookEvent);
    }

    this.logger.debug('Webhook event found', { webhookEventFound });

    // Check indepotent
    if (webhookEventFound.state === WebhookEventState.FAILED) {
      return webhookEventFound;
    }

    if (webhookEventFound.state !== WebhookEventState.PENDING) {
      throw new WebhookEventInvalidStateException(webhookEvent);
    }

    webhookEventFound.state = WebhookEventState.FAILED;
    webhookEventFound.httpStatusCodeResponse =
      webhookEvent.httpStatusCodeResponse;

    // Update webhook event found with state failed and httpStatusCodeResponse.
    await this.webhookEventRepository.update(webhookEventFound);

    // If webhook event found not is in retry limit, just do nothing.
    if (!webhookEventFound.isInRetryLimit()) {
      return webhookEventFound;
    }

    const webhookFound = await this.webhookRepository.getById(
      webhookEventFound.webhook?.id,
    );

    if (!webhookFound) {
      throw new WebhookNotFoundException(webhookEventFound.webhook);
    }

    // Generate new retry time.
    const lastRetry = this.generateRetryAt(webhookEventFound);

    const newWebhookEvent = new WebhookEventEntity({
      state: WebhookEventState.PENDING,
      targetUrl: webhookEventFound.targetUrl,
      apiKey: webhookEventFound.apiKey,
      webhook: webhookEventFound.webhook,
      type: webhookEventFound.type,
      accountNumber: webhookEventFound.accountNumber,
      agencyNumber: webhookEventFound.agencyNumber,
      data: webhookEventFound.data,
      retryLimit: webhookEventFound.retryLimit,
      lastRetry,
    });

    // Create new webhook event with state pending in database.
    const newWebhookEventCreated =
      await this.webhookEventRepository.create(newWebhookEvent);

    const data = {
      key: `${newWebhookEventCreated.id}`,
      headers: { requestId: newWebhookEventCreated.id },
      value: {
        id: newWebhookEventCreated.id,
        state: newWebhookEventCreated.state,
      },
    };

    const retry = new RetryEntity({
      id: newWebhookEventCreated.id,
      counter: 1,
      retryQueue: this.retryQueue,
      failQueue: this.failedQueue,
      retryAt: lastRetry,
      abortAt: webhookEventFound.retryLimit,
      data,
    });

    await this.retryService.push(retry);

    return newWebhookEventCreated;
  }

  generateRetryAt(lastWebhokEvent: WebhookEvent): Date {
    const lastTryRetry = lastWebhokEvent.lastRetry;

    // If the last webhook event not has lastTryRetry,
    // it is the first retry, so we use the min seconds.
    if (!lastTryRetry) {
      return getMoment().add(this.RETRY_MIN_SECONDS, 'seconds').toDate();
    }

    // Here we check the diff in seconds between the creation date of webhook event
    // and the last time that he was retried.
    const webhookEventCreatedAt = lastWebhokEvent.createdAt;
    const diffInMili = getMoment(lastTryRetry).diff(
      getMoment(webhookEventCreatedAt),
    );
    const diffInSeconds = diffInMili / 1000;

    // If this diff is biggest than the max of seconds,
    // we return the max of seconds.
    if (diffInSeconds >= this.RETRY_MAX_SECONDS) {
      return getMoment().add(this.RETRY_MAX_SECONDS, 'seconds').toDate();
    }

    // The quantity of times that was retried is
    // the diffInSeconds divided by RETRY_MIN_SECONDS.
    const retries = Math.floor(diffInSeconds / this.RETRY_MIN_SECONDS);

    // We increase the quantity the of retries than add to now
    return getMoment()
      .add(this.RETRY_MIN_SECONDS * (retries + 1), 'seconds')
      .toDate();
  }
}
