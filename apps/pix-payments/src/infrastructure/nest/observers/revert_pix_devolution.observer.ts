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
  KafkaServiceParam,
} from '@zro/common';
import {
  PixDevolutionRepository,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleRevertPixDevolutionEventController,
  PixDevolutionEventEmitterControllerInterface,
  HandleRevertPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandleRevertPixDevolutionEventKafkaRequest =
  KafkaMessage<HandleRevertPixDevolutionEventRequest>;

/**
 * PixDevolution revert events observer.
 */
@Controller()
@ObserverController()
export class RevertPixDevolutionNestObserver {
  /**
   * Handle PixDevolution revert event. PixDevolution is reverted here.
   *
   * @param message Event Kafka message.
   * @param devolutionRepository PixDevolution repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.REVERTED)
  async execute(
    @Payload('value') message: HandleRevertPixDevolutionEventRequest,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    serviceEventEmitter: PixDevolutionEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(RevertPixDevolutionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRevertPixDevolutionEventRequest(message);

    logger.info('Handle revert event pixDevolution.', { payload });

    const controller = new HandleRevertPixDevolutionEventController(
      logger,
      devolutionRepository,
      depositRepository,
      serviceEventEmitter,
      operationService,
    );

    try {
      // Call the pixDevolution controller.
      const result = await controller.execute(payload);

      logger.info('PixDevolution reverted.', { result });
    } catch (error) {
      logger.error('Failed to revert pixDevolution.', error);

      // FIXME: Should notify IT team.
    }
  }
}
