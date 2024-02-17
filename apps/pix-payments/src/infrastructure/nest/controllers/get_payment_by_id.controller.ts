import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { PaymentRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPaymentByIdRequest,
  GetPaymentByIdResponse,
  GetPaymentByIdController,
} from '@zro/pix-payments/interface';

export type GetPaymentByIdKafkaRequest = KafkaMessage<GetPaymentByIdRequest>;

export type GetPaymentByIdKafkaResponse = KafkaResponse<GetPaymentByIdResponse>;

/**
 * Get by id payment controller.
 */
@Controller()
@MicroserviceController()
export class GetPaymentByIdMicroserviceController {
  /**
   * Consumer of get payment by id.
   *
   * @param paymentRepository Payment repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_BY_ID)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @LoggerParam(GetPaymentByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPaymentByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPaymentByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPaymentByIdRequest(message);

    logger.info('Get payment by id from user.', { userId: payload.userId });

    // Get pix payment by id controller.
    const controller = new GetPaymentByIdController(logger, paymentRepository);

    const payment = await controller.execute(payload);

    logger.info('Payment found.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
