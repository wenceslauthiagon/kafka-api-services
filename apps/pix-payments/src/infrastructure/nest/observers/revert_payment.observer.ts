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
import { PaymentRepository } from '@zro/pix-payments/domain';
import {
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
  KAFKA_EVENTS,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  HandleRevertPaymentEventController,
  PaymentEventEmitterControllerInterface,
  HandleRevertPaymentEventRequest,
} from '@zro/pix-payments/interface';

export type HandleRevertPaymentEventKafkaRequest =
  KafkaMessage<HandleRevertPaymentEventRequest>;

/**
 * Payment revert events observer.
 */
@Controller()
@ObserverController()
export class RevertPaymentNestObserver {
  /**
   * Handle Payment revert event. Payment here revert.
   *
   * @param message Event Kafka message.
   * @param paymentRepository Payment repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.REVERTED)
  async execute(
    @Payload('value') message: HandleRevertPaymentEventRequest,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(RevertPaymentNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRevertPaymentEventRequest(message);

    logger.info('Handle revert event payment.', { payload });

    const controller = new HandleRevertPaymentEventController(
      logger,
      paymentRepository,
      serviceEventEmitter,
      operationService,
    );

    try {
      // Call the payment controller.
      const result = await controller.execute(payload);

      logger.info('Payment reverted.', { result });
    } catch (error) {
      logger.error('Failed to revert payment.', error);

      // FIXME: Should notify IT team.
    }
  }
}
