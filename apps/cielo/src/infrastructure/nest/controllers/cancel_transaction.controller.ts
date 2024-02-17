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
  CancelTransactionController,
  CancelTransactionRequest,
  CancelTransactionResponse,
} from '@zro/cielo/interface';

export type CancelTransactionKafkaRequest =
  KafkaMessage<CancelTransactionRequest>;

export type CancelTransactionKafkaResponse =
  KafkaResponse<CancelTransactionResponse>;
@Controller()
@MicroserviceController()
export class CancelTransactionMicroserviceController {
  constructor(private cieloClientService: CieloClientHttpService) {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.REFUND)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CancelTransactionController)
    logger: Logger,
    @Payload('value') message: CancelTransactionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelTransactionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelTransactionRequest(message);

    logger.info('Cancel/refund Cielo payment.', { payload });

    const service = new CieloService(this.cieloClientService);

    const controller = new CancelTransactionController(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
    );

    // Create payment
    const payment = await controller.execute(payload);

    logger.info('Cielo payment recived.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
