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
import { PixInfractionRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleAcknowledgePixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
  HandleAcknowledgePixInfractionEventController,
} from '@zro/pix-payments/interface';

export type AcknowledgePixInfractionKafkaRequest =
  KafkaMessage<HandleAcknowledgePixInfractionEventRequest>;

/**
 * Acknowledge pix infraction events observer.
 */
@Controller()
@ObserverController()
export class AcknowledgePixInfractionNestObserver {
  /**
   * Consumer of create acknowledge pix infraction.
   *
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.ACKNOWLEDGE)
  async execute(
    @LoggerParam(AcknowledgePixInfractionNestObserver)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @Payload('value') message: HandleAcknowledgePixInfractionEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleAcknowledgePixInfractionEventRequest(message);

    logger.info('Acknowledge pix infraction.', { payload });

    // Create and call acknowledge Infraction controller.
    const controller = new HandleAcknowledgePixInfractionEventController(
      logger,
      infractionRepository,
      eventEmitter,
    );

    // Create acknowledge pix infraction.
    await controller.execute(payload);

    logger.info('Infraction acknowledged.');
  }
}
