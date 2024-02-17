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
} from '@zro/cielo/interface';
import {
  CheckoutDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';

export type CreatePreCheckoutKafkaRequest =
  KafkaMessage<CreatePreCheckoutRequest>;

export type CreatePreCheckoutKafkaResponse =
  KafkaResponse<CreatePreCheckoutResponse>;

@Controller()
@MicroserviceController()
export class CreatePreCheckoutMicroserviceController {
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.PRE_CHECKOUT)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @LoggerParam(CreatePreCheckoutMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreatePreCheckoutRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreatePreCheckoutKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreatePreCheckoutRequest(message);

    logger.info('Create Cielo transaction pré checkout.', { payload });

    const controller = new CreatePreCheckoutController(
      logger,
      checkoutRepository,
    );

    // Create payment
    const payment = await controller.execute(payload);

    logger.info('Cielo transaction pre checkout created.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
