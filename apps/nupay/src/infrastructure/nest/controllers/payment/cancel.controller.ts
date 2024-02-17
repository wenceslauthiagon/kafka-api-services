import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import {
  CheckoutDatabaseRepository,
  KAFKA_TOPICS,
  PaymentService,
  NuPayClientService,
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
  CancelPaymentController,
  CancelPaymentRequest,
  CancelPaymentResponse,
} from '@zro/nupay/interface';

export type CancelPaymentKafkaRequest = KafkaMessage<CancelPaymentRequest>;

export type CancelPaymentKafkaResponse = KafkaResponse<CancelPaymentResponse>;

@Controller()
@MicroserviceController()
export class CancelPaymentMicroserviceController {
  constructor(private nuPayClientService: NuPayClientService) {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CANCEL)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @LoggerParam(CancelPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') request: CancelPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelPaymentKafkaResponse> {
    logger.debug('Received message.', { value: request });

    // Parse kafka message.
    const payload = request;

    logger.info('Cancel NuPay payment.', { payload });

    const service = new PaymentService(this.nuPayClientService);

    const controller = new CancelPaymentController(
      logger,
      service,
      checkoutRepository,
    );

    // Cancel payment
    const payment = await controller.execute(payload.checkoutId);

    logger.info('Payment cancelled.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
