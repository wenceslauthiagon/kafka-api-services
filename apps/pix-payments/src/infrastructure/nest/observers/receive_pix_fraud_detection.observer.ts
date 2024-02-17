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
  HandleReceivePixFraudDetectionEventRequest,
  HandleReceivePixFraudDetectionEventController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type ReceivePixFraudDetectionKafkaRequest =
  KafkaMessage<HandleReceivePixFraudDetectionEventRequest>;

/**
 * Receive pix fraud detection observer.
 */
@Controller()
@ObserverController()
export class ReceivePixFraudDetectionNestObserver {
  /**
   * Consumer of receive pix fraud detection.
   *
   * @param fraudDetectionRepository PixFraudDetection repository.
   * @param eventEmitter PixFraudDetection event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_FRAUD_DETECTION.RECEIVED)
  async execute(
    @RepositoryParam(PixFraudDetectionDatabaseRepository)
    fraudDetectionRepository: PixFraudDetectionRepository,
    @EventEmitterParam(PixFraudDetectionEventKafkaEmitter)
    eventEmitter: PixFraudDetectionEventEmitterControllerInterface,
    @LoggerParam(ReceivePixFraudDetectionNestObserver)
    logger: Logger,
    @Payload('value') message: HandleReceivePixFraudDetectionEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReceivePixFraudDetectionEventRequest(message);

    logger.info('Receive pix fraud detection.', { payload });

    // Create and call receive FraudDetection controller.
    const controller = new HandleReceivePixFraudDetectionEventController(
      logger,
      fraudDetectionRepository,
      eventEmitter,
    );

    // Create receive pix fraud detection.
    await controller.execute(payload);

    logger.info('Receive pix fraud detection created.');
  }
}
