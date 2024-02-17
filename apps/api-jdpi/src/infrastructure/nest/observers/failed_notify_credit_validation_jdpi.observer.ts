import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
} from '@zro/common';
import { NotifyCreditValidationRepository } from '@zro/api-jdpi/domain';
import {
  HandleFailedNotifyCreditValidationEventController,
  HandleFailedNotifyCreditValidationEventRequest,
} from '@zro/api-jdpi/interface';
import {
  KAFKA_EVENTS,
  NotifyCreditValidationDatabaseRepository,
} from '@zro/api-jdpi/infrastructure';

export type HandleFailedNotifyCreditEventKafkaRequest =
  KafkaMessage<HandleFailedNotifyCreditValidationEventRequest>;

/**
 * Failed notify credit validation create event observer.
 */
@Controller()
@ObserverController()
export class FailedNotifyCreditValidationNestObserver {
  /**
   * Handler triggered when failed notify credit validation created.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @param notifyCreditValidationRepository NotifyCreditValidation repository.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.NOTIFY_CREDIT_VALIDATION.ERROR)
  async execute(
    @Payload('value')
    message: HandleFailedNotifyCreditValidationEventRequest,
    @RepositoryParam(NotifyCreditValidationDatabaseRepository)
    notifyCreditValidationRepository: NotifyCreditValidationRepository,
    @LoggerParam(FailedNotifyCreditValidationNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleFailedNotifyCreditValidationEventRequest(message);

    logger.info('Handle added event failed notify credit validation.', {
      payload,
    });

    const controller = new HandleFailedNotifyCreditValidationEventController(
      logger,
      notifyCreditValidationRepository,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('Failed notify credit validation created.', { result });
    } catch (error) {
      logger.error('Failed to create failed notify credit validation.', error);

      // FIXME: Should notify IT team.
    }
  }
}
