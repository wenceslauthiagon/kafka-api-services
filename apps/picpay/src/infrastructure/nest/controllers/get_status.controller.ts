import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/picpay/infrastructure';
import {
  GetPaymentStatusController,
  GetPaymentStatusRequest,
  GetPaymentStatusResponse,
} from '@zro/picpay/interface';

export type GetPaymentStatusKafkaRequest =
  KafkaMessage<GetPaymentStatusRequest>;

export type GetPaymentStatusKafkaResponse =
  KafkaResponse<GetPaymentStatusResponse>;

@Controller()
@MicroserviceController()
export class GetPaymentStatusMicroserviceController {
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_STATUS)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(GetPaymentStatusMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPaymentStatusRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPaymentStatusKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPaymentStatusRequest(message);

    logger.info('Get PicPay payment status.', { payload });

    const controller = new GetPaymentStatusController(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );

    // Create payment
    const payment = await controller.execute(payload.checkoutId);

    logger.info('Picpay payment status recived.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
