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
  WarningPixDevolutionRepository,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleRevertWarningPixDevolutionEventController,
  WarningPixDevolutionEventEmitterControllerInterface,
  HandleRevertWarningPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandleRevertWarningPixDevolutionEventKafkaRequest =
  KafkaMessage<HandleRevertWarningPixDevolutionEventRequest>;

/**
 * WarningPixDevolution revert events observer.
 */
@Controller()
@ObserverController()
export class RevertWarningPixDevolutionNestObserver {
  /**
   * Handle WarningPixDevolution revert event. WarningPixDevolution is reverted here.
   *
   * @param message Event Kafka message.
   * @param devolutionRepository WarningPixDevolution repository.
   * @param depositRepository PixDeposit Repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.WARNING_PIX_DEVOLUTION.REVERTED)
  async execute(
    @Payload('value') message: HandleRevertWarningPixDevolutionEventRequest,
    @RepositoryParam(WarningPixDevolutionDatabaseRepository)
    devolutionRepository: WarningPixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(WarningPixDevolutionEventKafkaEmitter)
    serviceEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    @LoggerParam(RevertWarningPixDevolutionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRevertWarningPixDevolutionEventRequest(message);

    logger.info('Handle revert event warningPixDevolution.', { payload });

    const controller = new HandleRevertWarningPixDevolutionEventController(
      logger,
      devolutionRepository,
      depositRepository,
      serviceEventEmitter,
    );

    try {
      // Call the warningPixDevolution controller.
      const result = await controller.execute(payload);

      logger.info('WarningPixDevolution reverted.', { result });
    } catch (error) {
      logger.error('Failed to revert warningPixDevolution.', error);

      // FIXME: Should notify IT team.
    }
  }
}
