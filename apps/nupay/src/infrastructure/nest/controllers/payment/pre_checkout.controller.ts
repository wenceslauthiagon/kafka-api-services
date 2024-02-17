import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import {
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/nupay/infrastructure';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  RepositoryParam,
  LoggerParam,
  MicroserviceController,
  KafkaResponse,
  KafkaMessagePattern,
  KafkaMessage,
} from '@zro/common';
import {
  PreCheckoutController,
  PreCheckoutRequest,
  PreCheckoutResponse,
} from '@zro/nupay/interface';

export type PreCheckoutKafkaRequest = KafkaMessage<PreCheckoutRequest>;

export type PreCheckoutKafkaResponse = KafkaResponse<PreCheckoutResponse>;

@Controller()
@MicroserviceController()
export class PreCheckoutMicroserviceController {
  constructor() {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.PRE_CHECKOUT)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(PreCheckoutMicroserviceController)
    logger: Logger,
    @Payload('value') request: PreCheckoutRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<PreCheckoutKafkaResponse> {
    logger.debug('Received message.', { value: request });

    // Parse kafka message.
    const payload = request;

    logger.info('PreCheckout NuPay payment.', { payload });

    const controller = new PreCheckoutController(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );

    // PreCheckout payment
    const payment = await controller.execute(payload);

    logger.info('Payment pre-checkout created.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
