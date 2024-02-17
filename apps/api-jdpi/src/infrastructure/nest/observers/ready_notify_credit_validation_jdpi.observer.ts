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
  HandleReadyNotifyCreditValidationEventController,
  HandleReadyNotifyCreditValidationEventRequest,
} from '@zro/api-jdpi/interface';
import {
  KAFKA_EVENTS,
  NotifyCreditValidationDatabaseRepository,
} from '@zro/api-jdpi/infrastructure';

export type HandleReadyNotifyCreditEventKafkaRequest =
  KafkaMessage<HandleReadyNotifyCreditValidationEventRequest>;

/**
 * Ready notify credit validation create event observer.
 */
@Controller()
@ObserverController()
export class ReadyNotifyCreditValidationNestObserver {
  /**
   * Handler triggered when notify credit validation created.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @param notifyCreditValidationRepository NotifyCreditValidation repository.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.NOTIFY_CREDIT_VALIDATION.READY)
  async execute(
    @Payload('value')
    message: HandleReadyNotifyCreditValidationEventRequest,
    @RepositoryParam(NotifyCreditValidationDatabaseRepository)
    notifyCreditValidationRepository: NotifyCreditValidationRepository,
    @LoggerParam(ReadyNotifyCreditValidationNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReadyNotifyCreditValidationEventRequest(message);

    logger.info('Handle added event ready notify credit validation.', {
      payload,
    });

    const controller = new HandleReadyNotifyCreditValidationEventController(
      logger,
      notifyCreditValidationRepository,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('Ready notify credit validation created.', { result });
    } catch (error) {
      logger.error('Failed to create ready notify credit validation.', error);

      // FIXME: Should notify IT team.
    }
  }
}
