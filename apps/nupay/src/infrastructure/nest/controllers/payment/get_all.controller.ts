import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import {
  CheckoutDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/nupay/infrastructure';
import { KafkaContext, Ctx } from '@nestjs/microservices';
import {
  RepositoryParam,
  LoggerParam,
  MicroserviceController,
  KafkaResponse,
  KafkaMessagePattern,
  KafkaMessage,
} from '@zro/common';
import {
  GetAllPaymentController,
  GetAllPaymentResponse,
} from '@zro/nupay/interface';

export type GetAllPaymentKafkaRequest = KafkaMessage;

export type GetAllPaymentKafkaResponse = KafkaResponse<GetAllPaymentResponse>;

@Controller()
@MicroserviceController()
export class GetAllPaymentMicroserviceController {
  constructor() {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_ALL)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @LoggerParam(GetAllPaymentMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPaymentKafkaResponse> {
    logger.debug('Received message.');

    logger.info('GetAll NuPay payment.');

    const controller = new GetAllPaymentController(logger, checkoutRepository);

    // GetAll payments
    const payments = await controller.execute();

    logger.info('Payments returned.', { payments });

    return {
      ctx,
      value: payments,
    };
  }
}
