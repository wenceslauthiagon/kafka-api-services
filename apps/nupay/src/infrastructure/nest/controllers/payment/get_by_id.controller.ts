import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import {
  CheckoutDatabaseRepository,
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
  GetByIdPaymentController,
  GetByIdPaymentRequest,
  GetByIdPaymentResponse,
} from '@zro/nupay/interface';

export type GetByIdPaymentKafkaRequest = KafkaMessage<GetByIdPaymentRequest>;

export type GetByIdPaymentKafkaResponse = KafkaResponse<GetByIdPaymentResponse>;

@Controller()
@MicroserviceController()
export class GetByIdPaymentMicroserviceController {
  constructor() {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_BY_ID)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @LoggerParam(GetByIdPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') request: GetByIdPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetByIdPaymentKafkaResponse> {
    logger.debug('Received message.', { value: request });

    // Parse kafka message.
    const payload = request;

    logger.info('GetById NuPay payment.', { payload });

    const controller = new GetByIdPaymentController(logger, checkoutRepository);

    // GetById payment
    const payment = await controller.execute(payload.checkoutId);

    logger.info('Payment returned.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
