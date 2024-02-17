import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RepositoryParam,
} from '@zro/common';
import { PixFraudDetectionRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPixFraudDetectionReceivedEventRequest,
  HandleCancelPixFraudDetectionReceivedEventController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CancelPixFraudDetectionReceivedKafkaRequest =
  KafkaMessage<HandleCancelPixFraudDetectionReceivedEventRequest>;

/**
 * Receive pix fraud detection observer.
 */
@Controller()
@ObserverController()
export class CancelPixFraudDetectionReceivedNestObserver {
  /**
   * Consumer of receive pix fraud detection.
   *
   * @param fraudDetectionRepository PixFraudDetection repository.
   * @param eventEmitter PixFraudDetection event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_FRAUD_DETECTION.CANCELED_RECEIVED)
  async execute(
    @RepositoryParam(PixFraudDetectionDatabaseRepository)
    fraudDetectionRepository: PixFraudDetectionRepository,
    @EventEmitterParam(PixFraudDetectionEventKafkaEmitter)
    eventEmitter: PixFraudDetectionEventEmitterControllerInterface,
    @LoggerParam(CancelPixFraudDetectionReceivedNestObserver)
    logger: Logger,
    @Payload('value')
    message: HandleCancelPixFraudDetectionReceivedEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCancelPixFraudDetectionReceivedEventRequest(
      message,
    );

    logger.info('Receive pix fraud detection.', { payload });

    // Create and call receive FraudDetection controller.
    const controller = new HandleCancelPixFraudDetectionReceivedEventController(
      logger,
      fraudDetectionRepository,
      eventEmitter,
    );

    // Create receive pix fraud detection.
    await controller.execute(payload);

    logger.info('Receive pix fraud detection created.');
  }
}
