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
  WarningPixDepositRepository,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  WarningPixDepositDatabaseRepository,
  PixDepositDatabaseRepository,
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  WarningPixDevolutionEventEmitterControllerInterface,
  HandleCreateWarningPixDevolutionEventController,
  HandleCreateWarningPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandleCreateWarningPixDevolutionEventKafkaRequest =
  KafkaMessage<HandleCreateWarningPixDevolutionEventRequest>;

/**
 * WarningPixDevolution create event observer.
 */
@Controller()
@ObserverController()
export class CreateWarningPixDevolutionNestObserver {
  /**
   * Handler triggered when devolution is created.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.WARNING_PIX_DEVOLUTION.CREATED)
  async execute(
    @Payload('value')
    message: HandleCreateWarningPixDevolutionEventRequest,
    @RepositoryParam(WarningPixDevolutionDatabaseRepository)
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    @RepositoryParam(WarningPixDepositDatabaseRepository)
    warningPixDepositRepository: WarningPixDepositRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(WarningPixDevolutionEventKafkaEmitter)
    serviceWarningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    @LoggerParam(CreateWarningPixDevolutionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCreateWarningPixDevolutionEventRequest(message);

    logger.info('Handle added event create warning pix devolution.', {
      payload,
    });

    const controller = new HandleCreateWarningPixDevolutionEventController(
      logger,
      warningPixDevolutionRepository,
      warningPixDepositRepository,
      serviceWarningPixDevolutionEventEmitter,
      depositRepository,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('Warning pix devolution created.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to create warning pix devolution.', {
        error: logError,
      });
    }
  }
}
