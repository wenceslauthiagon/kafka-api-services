import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { PaymentRepository } from '@zro/pix-payments/domain';
import {
  CancelPaymentByOperationIdController,
  CancelPaymentByOperationIdRequest,
  CancelPaymentByOperationIdResponse,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';

export type CancelPaymentByOperationIdKafkaRequest =
  KafkaMessage<CancelPaymentByOperationIdRequest>;

export type CancelPaymentByOperationIdKafkaResponse =
  KafkaResponse<CancelPaymentByOperationIdResponse>;

/**
 * CancelPayment controller.
 */
@Controller()
@MicroserviceController()
export class CancelPaymentByOperationIdMicroserviceController {
  /**
   * Consumer of start pix payment canceling process.
   *
   * @param paymentRepository Payment repository.
   * @param eventEmitter Payment event emitter.
   * @param logger Logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CANCEL_BY_ID)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    eventEmitter: PaymentEventEmitterControllerInterface,
    @LoggerParam(CancelPaymentByOperationIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelPaymentByOperationIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelPaymentByOperationIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelPaymentByOperationIdRequest(message);

    logger.info('Cancel pix payment process.', { payload });

    // Create and call cancel pix payment controller.
    const controller = new CancelPaymentByOperationIdController(
      logger,
      paymentRepository,
      eventEmitter,
    );

    // Create and call cancel pix payment.
    const payment = await controller.execute(payload);

    logger.info('Pix payment canceling started.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
