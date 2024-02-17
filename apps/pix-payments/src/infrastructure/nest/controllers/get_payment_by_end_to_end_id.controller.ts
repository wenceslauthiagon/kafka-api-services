import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
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
  GetPaymentByEndToEndIdRequest,
  GetPaymentByEndToEndIdResponse,
  GetPaymentByEndToEndIdController,
} from '@zro/pix-payments/interface';

export type GetPaymentByEndToEndIdKafkaRequest =
  KafkaMessage<GetPaymentByEndToEndIdRequest>;

export type GetPaymentByEndToEndIdKafkaResponse =
  KafkaResponse<GetPaymentByEndToEndIdResponse>;

/**
 * Get by EndToEndId payment controller.
 */
@CacheTTL()
@Controller()
@MicroserviceController()
export class GetPaymentByEndToEndIdMicroserviceController {
  /**
   * Consumer of get payment by EndToEndId.
   *
   * @param paymentRepository Payment repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_BY_END_TO_END_ID)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @LoggerParam(GetPaymentByEndToEndIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPaymentByEndToEndIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPaymentByEndToEndIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPaymentByEndToEndIdRequest(message);

    logger.info('Get payment by EndToEndId from user.', {
      userId: payload.userId,
    });

    // Get pix payment by EndToEndId controller.
    const controller = new GetPaymentByEndToEndIdController(
      logger,
      paymentRepository,
    );

    const payment = await controller.execute(payload);

    logger.info('Payment found.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
