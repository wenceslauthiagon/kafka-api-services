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
  HandleCompletePaymentEventController,
  PaymentEventEmitterControllerInterface,
  HandleCompletePaymentEventRequest,
} from '@zro/pix-payments/interface';

export type HandleCompletePaymentEventKafkaRequest =
  KafkaMessage<HandleCompletePaymentEventRequest>;

/**
 * Payment complete events observer.
 */
@Controller()
@ObserverController()
export class CompletePaymentNestObserver {
  /**
   * Handler triggered when payment is complete.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.COMPLETED)
  async handleCompletePaymentEvent(
    @Payload('value') message: HandleCompletePaymentEventRequest,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(CompletePaymentNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCompletePaymentEventRequest(message);

    logger.info('Handle added event complete payment.', { payload });

    const controller = new HandleCompletePaymentEventController(
      logger,
      paymentRepository,
      serviceEventEmitter,
      operationService,
    );

    try {
      // Call the payment controller.
      const result = await controller.execute(payload);

      logger.info('Payment completed.', { result });
    } catch (error) {
      logger.error('Failed to complete payment.', error);

      // FIXME: Should notify IT team.
    }
  }
}
