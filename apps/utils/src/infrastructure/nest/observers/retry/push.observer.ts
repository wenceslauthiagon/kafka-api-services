import {
  Controller,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  InjectLogger,
  KafkaMessage,
  KafkaEventPattern,
  KafkaService,
  KAFKA_SERVICE,
  LoggerParam,
  ObserverController,
  RepositoryParam,
} from '@zro/common';
import { RetryRepository } from '@zro/utils/domain';
import {
  KAFKA_EVENTS,
  RetryDatabaseRepository,
} from '@zro/utils/infrastructure';
import {
  DeleteRetryController,
  GetAllRetryController,
  PushRetryController,
  PushRetryRequest,
} from '@zro/utils/interface';

export type PushRetryKafkaRequest = KafkaMessage<PushRetryRequest>;

interface RetryConfig {
  APP_ENV: string;
  APP_RETRY_INTERVAL_MS: number;
  APP_RETRY_PER_INTERVAL: number;
}

@Controller()
@ObserverController()
export class PushRetryNestObserver implements OnModuleInit, OnModuleDestroy {
  private retryQueue: PushRetryRequest[] = [];
  private retryAgent: ReturnType<typeof setInterval> = null;
  private isRunning = false;
  private retryTimeInterval = 100;

  constructor(
    @InjectLogger() private logger: Logger,
    @Inject(KAFKA_SERVICE) private kafkaService: KafkaService,
    private configService: ConfigService<RetryConfig>,
  ) {
    this.logger = logger.child({ context: PushRetryNestObserver.name });
    this.retryTimeInterval = this.configService.get<number>(
      'APP_RETRY_INTERVAL_MS',
      100,
    );
  }

  /**
   * Stop retry process.
   */
  onModuleDestroy() {
    if (this.retryAgent) {
      clearInterval(this.retryAgent);
    }
  }

  /**
   * Load all retry events from the database and start interval event.
   */
  async onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }
    const retryRepository = new RetryDatabaseRepository();
    const controller = new GetAllRetryController(this.logger, retryRepository);
    this.retryQueue = await controller.execute();

    this.retryAgent = setInterval(
      () => this.handleRetryEvent(),
      this.retryTimeInterval,
    );
  }

  /**
   * Process retry list.
   */
  async handleRetryEvent() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    const retryRepository = new RetryDatabaseRepository();
    const deleteController = new DeleteRetryController(
      this.logger,
      retryRepository,
    );

    const now = Date.now();

    // Get all retry events that are ready to be retried.
    const retryQueue = this.retryQueue.filter(
      (r) => r.retryAt.getTime() <= now && r.abortAt.getTime() > now,
    );

    // Retry an event.
    for (const retry of retryQueue) {
      this.logger.info('Firing a retry event.', { retry });
      // Emit retry event.
      await this.kafkaService.emit(retry.retryQueue, retry.data);
      await deleteController.execute(retry);
    }

    // Remove retried event.
    this.retryQueue = this.retryQueue.filter((r) => !retryQueue.includes(r));

    // Get all aborted events.
    const abortQueue = this.retryQueue.filter(
      (r) => r.abortAt.getTime() <= now,
    );

    // Abort an event.
    for (const retry of abortQueue) {
      this.logger.info('Firing a retry fail event.', { retry });
      // Emit retry event.
      await this.kafkaService.emit(retry.failQueue, retry.data);
      await deleteController.execute(retry);
    }

    // Remove aborted event.
    this.retryQueue = this.retryQueue.filter((r) => !abortQueue.includes(r));

    this.isRunning = false;
  }

  /**
   * Handler triggered when payment is complete.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.RETRY.PUSH)
  async handlePushRetryEvent(
    @Payload('value') message: PushRetryRequest,
    @RepositoryParam(RetryDatabaseRepository)
    retryRepository: RetryRepository,
    @LoggerParam(PushRetryNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    const data = {
      id: message?.id,
      counter: message?.counter,
      retryQueue: message?.retryQueue,
      failQueue: message?.failQueue,
      retryAt: message?.retryAt && new Date(message?.retryAt),
      abortAt: message?.abortAt && new Date(message?.abortAt),
      data: message?.data,
    };

    // Parse kafka message.
    const payload = new PushRetryRequest(data);

    logger.info('Pushing a retry event.', { payload });

    const controller = new PushRetryController(logger, retryRepository);

    try {
      // Call the payment controller.
      const result = await controller.execute(payload);

      // Add payload to event queue
      this.retryQueue.push(payload);

      logger.info('Retry pushed.', { result });
    } catch (error) {
      logger.error('Failed to push a retry event', { error });

      // Send retry to failed queue. We have to fail a retry request because
      // we are not able to recover from this error.
      this.kafkaService.emit(payload.failQueue, payload.data);

      // FIXME: Should notify IT team.
    }
  }
}
