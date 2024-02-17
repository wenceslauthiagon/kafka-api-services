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
import { PixFraudDetectionRepository } from '@zro/pix-payments/domain';
import {
  PixFraudDetectionDatabaseRepository,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePixFraudDetectionDeadLetterEventController,
  HandlePixFraudDetectionDeadLetterEventRequest,
} from '@zro/pix-payments/interface';

export type HandlePixFraudDetectionDeadLetterFraudDetectionEventKafkaRequest =
  KafkaMessage<HandlePixFraudDetectionDeadLetterEventRequest>;

/**
 * PixFraudDetection dead letter event observer.
 */
@Controller()
@ObserverController()
export class PixFraudDetectionDeadLetterFraudDetectionNestObserver {
  /**
   * Handle PixFraudDetection dead letter event. PixFraudDetection here dead letter.
   *
   * @param message Event Kafka message.
   * @param pixFraudDetectionRepository PixFraudDetection repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_FRAUD_DETECTION.FAILED)
  async execute(
    @Payload('value')
    message: HandlePixFraudDetectionDeadLetterEventRequest,
    @RepositoryParam(PixFraudDetectionDatabaseRepository)
    pixFraudDetectionRepository: PixFraudDetectionRepository,
    @LoggerParam(PixFraudDetectionDeadLetterFraudDetectionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePixFraudDetectionDeadLetterEventRequest(message);

    logger.info('Handle pix fraud detection dead letter.', { payload });

    const controller = new HandlePixFraudDetectionDeadLetterEventController(
      logger,
      pixFraudDetectionRepository,
    );

    try {
      // Call the pix fraud detection dead letter controller.
      await controller.execute(payload);

      logger.info('Pix fraud detection dead letter handled.');
    } catch (error) {
      logger.error('Failed to handle pix fraud detection dead letter.', error);

      // FIXME: Should notify IT team.
    }
  }
}
