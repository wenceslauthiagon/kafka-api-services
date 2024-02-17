import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  LoggerParam,
  RepositoryParam,
  ObserverController,
} from '@zro/common';
import { PixInfractionRepository } from '@zro/pix-payments/domain';
import {
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import {
  HandleRevertPixInfractionEventController,
  PixInfractionEventEmitterControllerInterface,
  HandleRevertPixInfractionEventRequest,
} from '@zro/pix-payments/interface';

export type HandleRevertPixInfractionEventKafkaRequest =
  KafkaMessage<HandleRevertPixInfractionEventRequest>;

/**
 * PixInfraction revert events observer.
 */
@Controller()
@ObserverController()
export class RevertPixInfractionNestObserver {
  /**
   * Handle PixInfraction revert event. PixInfraction here revert.
   *
   * @param message Event Kafka message.
   * @param pix infractionRepository PixInfraction repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.REVERTED)
  async execute(
    @Payload('value') message: HandleRevertPixInfractionEventRequest,
    @RepositoryParam(PixInfractionDatabaseRepository)
    pixInfractionRepository: PixInfractionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    serviceEventEmitter: PixInfractionEventEmitterControllerInterface,
    @LoggerParam(RevertPixInfractionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRevertPixInfractionEventRequest(message);

    logger.info('Handle revert event pix infraction.', { payload });

    const controller = new HandleRevertPixInfractionEventController(
      logger,
      pixInfractionRepository,
      serviceEventEmitter,
    );

    try {
      // Call the pix infraction controller.
      const result = await controller.execute(payload);

      logger.info('Pix infraction reverted.', { result });
    } catch (error) {
      logger.error('Failed to revert pix infraction.', error);

      // FIXME: Should notify IT team.
    }
  }
}
