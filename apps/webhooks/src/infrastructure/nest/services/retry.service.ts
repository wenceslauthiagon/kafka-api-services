import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Retry } from '@zro/utils/domain';
import { RetryService } from '@zro/webhooks/application';
import { RetryPushServiceKafka } from '@zro/utils/infrastructure';
import { PushRetryRequest } from '@zro/utils/interface';

/**
 * Retry microservice
 */
export class RetryServiceKafka implements RetryService {
  static _services: any[] = [RetryPushServiceKafka];

  private readonly pushRetryService: RetryPushServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: RetryServiceKafka.name });

    this.pushRetryService = new RetryPushServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Push retry microservice.
   * @param retry the retry to push.
   */
  async push(retry: Retry): Promise<void> {
    const payload: PushRetryRequest = {
      id: retry.id,
      counter: retry.counter,
      retryQueue: retry.retryQueue,
      failQueue: retry.failQueue,
      retryAt: retry.retryAt,
      abortAt: retry.abortAt,
      data: retry.data,
    };

    await this.pushRetryService.execute(payload);
  }
}
