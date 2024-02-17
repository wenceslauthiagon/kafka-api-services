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
import {
  DecodedPixAccountRepository,
  DecodedQrCodeRepository,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
  DecodedQrCodeDatabaseRepository,
  DecodedPixAccountDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPaymentByOperationIdRequest,
  GetPaymentByOperationIdResponse,
  GetPaymentByOperationIdController,
} from '@zro/pix-payments/interface';

export type GetPaymentByOperationIdKafkaRequest =
  KafkaMessage<GetPaymentByOperationIdRequest>;

export type GetPaymentByOperationIdKafkaResponse =
  KafkaResponse<GetPaymentByOperationIdResponse>;

/**
 * Get by id payment controller.
 */
@Controller()
@MicroserviceController()
export class GetPaymentByOperationIdMicroserviceController {
  /**
   * Consumer of get payment by id.
   *
   * @param paymentRepository Payment repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_BY_OPERATION_ID)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(DecodedQrCodeDatabaseRepository)
    decodedQrCodeRepository: DecodedQrCodeRepository,
    @RepositoryParam(DecodedPixAccountDatabaseRepository)
    decodedPixAccountRepository: DecodedPixAccountRepository,
    @LoggerParam(GetPaymentByOperationIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPaymentByOperationIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPaymentByOperationIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPaymentByOperationIdRequest(message);

    logger.info('Get payment by id from user.', { userId: payload.userId });

    // Get pix payment by id controller.
    const controller = new GetPaymentByOperationIdController(
      logger,
      paymentRepository,
      decodedQrCodeRepository,
      decodedPixAccountRepository,
    );

    const payment = await controller.execute(payload);

    logger.info('Payment found.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
