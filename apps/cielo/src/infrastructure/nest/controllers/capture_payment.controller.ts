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
  CieloClientHttpService,
  CieloService,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import {
  CapturePaymentController,
  CapturePaymentRequest,
  CapturePaymentResponse,
} from '@zro/cielo/interface';

export type CapturePaymentKafkaRequest = KafkaMessage<CapturePaymentRequest>;

export type CapturePaymentKafkaResponse = KafkaResponse<CapturePaymentResponse>;
@Controller()
@MicroserviceController()
export class CapturePaymentMicroserviceController {
  constructor(private cieloClientService: CieloClientHttpService) {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CAPTURE)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CapturePaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: CapturePaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CapturePaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    const service = new CieloService(this.cieloClientService);

    // Parse kafka message.
    const payload = new CapturePaymentRequest(message);

    logger.info('Capture Cielo payment.', { payload });

    const controller = new CapturePaymentController(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
      service,
    );

    // Capture payment
    const payment = await controller.execute(payload);

    logger.info('Cielo payment captured.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
