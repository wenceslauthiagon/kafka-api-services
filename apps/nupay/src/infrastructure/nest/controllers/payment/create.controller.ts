import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import {
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
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
  CreatePaymentController,
  CreatePaymentRequest,
  CreatePaymentResponse,
} from '@zro/nupay/interface';

export type CreatePaymentKafkaRequest = KafkaMessage<CreatePaymentRequest>;

export type CreatePaymentKafkaResponse = KafkaResponse<CreatePaymentResponse>;

@Controller()
@MicroserviceController()
export class CreatePaymentMicroserviceController {
  constructor(private nuPayClientService: NuPayClientService) {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreatePaymentMicroserviceController)
    logger: Logger,
    @Payload('value') request: CreatePaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreatePaymentKafkaResponse> {
    logger.debug('Received message.', { value: request });

    // Parse kafka message.
    const payload = request;

    logger.info('Create NuPay payment.', { payload });

    const service = new PaymentService(this.nuPayClientService);

    const controller = new CreatePaymentController(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
    );

    // Create payment
    const payment = await controller.execute(payload.checkoutId);

    logger.info('Payment created.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
