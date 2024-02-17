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
  CreatePreCheckoutController,
  CreatePreCheckoutRequest,
  CreatePreCheckoutResponse,
} from '@zro/picpay/interface';
import {
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/picpay/infrastructure';

export type CreatePreCheckoutKafkaRequest =
  KafkaMessage<CreatePreCheckoutRequest>;

export type CreatePreCheckoutKafkaResponse =
  KafkaResponse<CreatePreCheckoutResponse>;

@Controller()
@MicroserviceController()
export class CreateCheckoutMicroserviceController {
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.PRE_CHECKOUT)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreateCheckoutMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreatePreCheckoutRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreatePreCheckoutKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreatePreCheckoutRequest(message);

    logger.info('Create PicPay payment pré checkout.', { payload });

    const controller = new CreatePreCheckoutController(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );

    // Create payment
    const payment = await controller.execute(payload);

    logger.info('PicPay payment pré checkout created.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
