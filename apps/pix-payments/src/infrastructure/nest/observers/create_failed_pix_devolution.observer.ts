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
import {
  PixDepositRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixDepositDatabaseRepository,
  PixDevolutionDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  PixDevolutionEventEmitterControllerInterface,
  HandleCreateFailedPixDevolutionEventController,
  HandleCreateFailedPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandleCreateFailedPixDevolutionEventKafkaRequest =
  KafkaMessage<HandleCreateFailedPixDevolutionEventRequest>;

/**
 * Failed pix devolution create event observer.
 */
@Controller()
@ObserverController()
export class CreateFailedPixDevolutionNestObserver {
  /**
   * Handler triggered when devolution is created.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.CREATE_FAILED)
  async execute(
    @Payload('value')
    message: HandleCreateFailedPixDevolutionEventRequest,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    pixDevolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    pixDepositRepository: PixDepositRepository,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    servicePixDevolutionEventEmitter: PixDevolutionEventEmitterControllerInterface,
    @LoggerParam(CreateFailedPixDevolutionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCreateFailedPixDevolutionEventRequest(message);

    logger.info('Handle added event create failed pix devolution.', {
      payload,
    });

    const controller = new HandleCreateFailedPixDevolutionEventController(
      logger,
      pixDevolutionRepository,
      pixDepositRepository,
      servicePixDevolutionEventEmitter,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('Failed pix devolution created.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to create failed pix devolution.', {
        error: logError,
      });
    }
  }
}
