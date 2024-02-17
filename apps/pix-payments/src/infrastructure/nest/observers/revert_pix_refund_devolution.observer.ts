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
  PixRefundDevolutionRepository,
  PixDepositRepository,
  PixInfractionRefundOperationRepository,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionDatabaseRepository,
  PixRefundDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
  PixRefundDatabaseRepository,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleRevertPixRefundDevolutionEventController,
  PixRefundDevolutionEventEmitterControllerInterface,
  HandleRevertPixRefundDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandleRevertPixRefundDevolutionEventKafkaRequest =
  KafkaMessage<HandleRevertPixRefundDevolutionEventRequest>;

/**
 * PixRefundDevolution revert events observer.
 */
@Controller()
@ObserverController()
export class RevertPixRefundDevolutionNestObserver {
  /**
   * Handle PixRefundDevolution revert event. PixRefundDevolution is reverted here.
   *
   * @param message Event Kafka message.
   * @param devolutionRepository PixRefundDevolution repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND_DEVOLUTION.REVERTED)
  async execute(
    @Payload('value') message: HandleRevertPixRefundDevolutionEventRequest,
    @RepositoryParam(PixRefundDevolutionDatabaseRepository)
    devolutionRepository: PixRefundDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @RepositoryParam(PixRefundDatabaseRepository)
    pixRefundRepository: PixRefundRepository,
    @EventEmitterParam(PixRefundDevolutionEventKafkaEmitter)
    serviceEventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(RevertPixRefundDevolutionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRevertPixRefundDevolutionEventRequest(message);

    logger.info('Handle revert event pixDevolution.', { payload });

    const controller = new HandleRevertPixRefundDevolutionEventController(
      logger,
      devolutionRepository,
      depositRepository,
      pixInfractionRefundOperationRepository,
      pixRefundRepository,
      serviceEventEmitter,
      operationService,
    );

    try {
      // Call the pixDevolution controller.
      const result = await controller.execute(payload);

      logger.info('PixRefundDevolution reverted.', { result });
    } catch (error) {
      logger.error('Failed to revert pixDevolution.', error);

      // FIXME: Should notify IT team.
    }
  }
}
