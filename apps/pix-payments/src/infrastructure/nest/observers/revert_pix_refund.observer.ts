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
import { PixRefundRepository } from '@zro/pix-payments/domain';
import {
  PixRefundDatabaseRepository,
  PixRefundEventKafkaEmitter,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import {
  HandleRevertPixRefundEventController,
  PixRefundEventEmitterControllerInterface,
  HandleRevertPixRefundEventRequest,
} from '@zro/pix-payments/interface';

export type HandleRevertPixRefundEventKafkaRequest =
  KafkaMessage<HandleRevertPixRefundEventRequest>;

/**
 * PixRefund revert events observer.
 */
@Controller()
@ObserverController()
export class RevertPixRefundNestObserver {
  /**
   * Handle PixRefund revert event. PixRefund here revert.
   *
   * @param message Event Kafka message.
   * @param pix refundRepository PixRefund repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND.REVERTED)
  async execute(
    @Payload('value') message: HandleRevertPixRefundEventRequest,
    @RepositoryParam(PixRefundDatabaseRepository)
    pixRefundRepository: PixRefundRepository,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    serviceEventEmitter: PixRefundEventEmitterControllerInterface,
    @LoggerParam(RevertPixRefundNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRevertPixRefundEventRequest(message);

    logger.info('Handle revert event pix refund.', { payload });

    const controller = new HandleRevertPixRefundEventController(
      logger,
      pixRefundRepository,
      serviceEventEmitter,
    );

    try {
      // Call the pix refund controller.
      const result = await controller.execute(payload);

      logger.info('Pix refund reverted.', { result });
    } catch (error) {
      logger.error('Failed to revert pix refund.', error);

      // FIXME: Should notify IT team.
    }
  }
}
