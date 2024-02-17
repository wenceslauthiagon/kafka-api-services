import { Controller } from '@nestjs/common';
import { Logger } from 'winston';
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
} from '@zro/cielo/infrastructure';
import {
  GetPaymentController,
  GetPaymentRequest,
  GetPaymentResponse,
} from '@zro/cielo/interface';

export type GetPaymentKafkaRequest = KafkaMessage<GetPaymentRequest>;

export type GetPaymentKafkaResponse = KafkaResponse<GetPaymentResponse>;
@Controller()
@MicroserviceController()
export class GetPaymentMicroserviceController {
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(GetPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPaymentRequest(message);

    logger.info('Get Cielo payment.', { payload });

    const controller = new GetPaymentController(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );

    // Create payment
    const payment = await controller.execute(payload.CheckoutId);

    logger.info('Cielo payment recived.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
