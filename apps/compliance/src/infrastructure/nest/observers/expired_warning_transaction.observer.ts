import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
} from '@zro/common';
import {
  JiraWarningTransactionGatewayParam,
  JiraWarningTransactionInterceptor,
} from '@zro/jira';
import { WarningTransactionRepository } from '@zro/compliance/domain';
import { WarningTransactionGateway } from '@zro/compliance/application';
import {
  KAFKA_EVENTS,
  WarningTransactionDatabaseRepository,
  WarningTransactionEventKafkaEmitter,
} from '@zro/compliance/infrastructure';
import {
  HandleExpiredWarningTransactionEventController,
  HandleExpiredWarningTransactionEventRequest,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

export type HandleExpiredWarningTransactionEventKafka =
  KafkaMessage<HandleExpiredWarningTransactionEventRequest>;

/**
 * WarningTransaction complete events observer.
 */
@Controller()
@ObserverController([JiraWarningTransactionInterceptor])
export class ExpiredWarningTransactionNestObserver {
  /**
   * Handler triggered when infraction is complete.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.WARNING_TRANSACTION.EXPIRED)
  async execute(
    @Payload('value') message: HandleExpiredWarningTransactionEventRequest,
    @RepositoryParam(WarningTransactionDatabaseRepository)
    warningTransactionRepository: WarningTransactionRepository,
    @JiraWarningTransactionGatewayParam()
    warningTransactionGateway: WarningTransactionGateway,
    @EventEmitterParam(WarningTransactionEventKafkaEmitter)
    warningTransactionEventEmitter: WarningTransactionEventEmitterControllerInterface,
    @LoggerParam(ExpiredWarningTransactionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleExpiredWarningTransactionEventRequest(message);

    logger.info('Handle pending infraction.', { payload });

    const controller = new HandleExpiredWarningTransactionEventController(
      logger,
      warningTransactionRepository,
      warningTransactionGateway,
      warningTransactionEventEmitter,
    );

    try {
      // Call open infraction handle.
      const result = await controller.execute(payload);

      logger.info('Warning transaction issue closed.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to close warning transaction issue.', {
        error: logError,
      });
    }
  }
}
