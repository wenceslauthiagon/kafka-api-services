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
  KafkaServiceParam,
} from '@zro/common';
import {
  PixInfractionRefundOperationRepository,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  OperationServiceKafka,
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  PixInfractionEventEmitterControllerInterface,
  HandleCancelPixInfractionReceivedEventRequest,
  HandleCancelPixInfractionReceivedEventController,
} from '@zro/pix-payments/interface';

export type CancelPixInfractionReceivedKafkaRequest =
  KafkaMessage<HandleCancelPixInfractionReceivedEventRequest>;

/**
 * Cancel pix infraction received events observer.
 */
@Controller()
@ObserverController()
export class CancelPixInfractionReceivedNestObserver {
  /**
   * Consumer of create cancel pix infraction received.
   *
   * @param infractionRepository Infraction repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param eventEmitter Infraction event emitter.
   * @param operationService Operation service.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.CANCEL_RECEIVED)
  async execute(
    @LoggerParam(CancelPixInfractionReceivedNestObserver)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @Payload('value') message: HandleCancelPixInfractionReceivedEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCancelPixInfractionReceivedEventRequest(message);

    logger.info('Cancel pix infraction received.', { payload });

    // Create and call cancel Infraction controller.
    const controller = new HandleCancelPixInfractionReceivedEventController(
      logger,
      infractionRepository,
      pixInfractionRefundOperationRepository,
      operationService,
      eventEmitter,
    );

    // Create cancel pix infraction.
    await controller.execute(payload);

    logger.info('Infraction received canceled.');
  }
}
