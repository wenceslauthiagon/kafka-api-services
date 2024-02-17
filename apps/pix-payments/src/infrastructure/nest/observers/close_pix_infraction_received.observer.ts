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
  PixInfractionEventEmitterControllerInterface,
  HandleClosePixInfractionReceivedEventRequest,
  HandleClosePixInfractionReceivedEventController,
} from '@zro/pix-payments/interface';

export type HandleClosePixInfractionReceivedEventKafkaRequest =
  KafkaMessage<HandleClosePixInfractionReceivedEventRequest>;

/**
 * Close pix infraction events observer.
 */
@Controller()
@ObserverController()
export class ClosePixInfractionReceivedNestObserver {
  /**
   * Consumer of create close pix infraction.
   *
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.CLOSE_RECEIVED)
  async execute(
    @LoggerParam(ClosePixInfractionReceivedNestObserver)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @Payload('value') message: HandleClosePixInfractionReceivedEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClosePixInfractionReceivedEventRequest(message);

    logger.info('Close pix infraction received.', { payload });

    // Create and call close Infraction controller.
    const controller = new HandleClosePixInfractionReceivedEventController(
      logger,
      infractionRepository,
      eventEmitter,
    );

    // Create close pix infraction.
    await controller.execute(payload);

    logger.info('Infraction received closed.');
  }
}
