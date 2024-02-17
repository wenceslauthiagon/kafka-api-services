import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RepositoryParam,
} from '@zro/common';
import {
  UserLimitTrackerRepository,
  UserLimitRepository,
  OperationRepository,
} from '@zro/operations/domain';
import {
  HandleRevertedOperationEventRequest,
  HandleRevertedOperationEventController,
} from '@zro/operations/interface';
import {
  KAFKA_EVENTS,
  UserLimitTrackerDatabaseRepository,
  UserLimitDatabaseRepository,
  OperationDatabaseRepository,
} from '@zro/operations/infrastructure';

export type HandleRevertedOperationEventKafkaRequest =
  KafkaMessage<HandleRevertedOperationEventRequest>;

/**
 * Handle reverted operation based on new reverted operation event.
 */
@Controller()
@ObserverController()
export class RevertedOperationNestObserver {
  /**
   * Handler triggered when operation event is reverted.
   *
   * @param message Event Kafka message.
   * @param userLimitTrackerRepository UserLimitTracker repository.
   * @param transactionTypeRepository TransactionType repository.
   * @param limitTypeRepository LimitType repository.
   * @param userLimitRepository UserLimit repository.
   * @param operationRepository Operation repository.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.OPERATION.REVERTED)
  async executeRevertedOperation(
    @Payload('value')
    message: HandleRevertedOperationEventRequest,
    @RepositoryParam(UserLimitTrackerDatabaseRepository)
    userLimitTrackerRepository: UserLimitTrackerRepository,
    @RepositoryParam(UserLimitDatabaseRepository)
    userLimitRepository: UserLimitRepository,
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @LoggerParam(RevertedOperationNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', {
      value: message,
    });

    // Parse kafka message.
    const payload = new HandleRevertedOperationEventRequest(message);

    logger.info('Handle reverted operation event payload.', {
      payload,
    });

    const controller = new HandleRevertedOperationEventController(
      logger,
      userLimitTrackerRepository,
      userLimitRepository,
      operationRepository,
    );

    try {
      // Call handle Handle reverted operation controller.
      await controller.execute(payload);

      logger.info('Handle reverted operation event handled.');
    } catch (error) {
      logger.error('Failed to handle reverted operation event.', {
        stack: error.stack,
      });
    }
  }
}
