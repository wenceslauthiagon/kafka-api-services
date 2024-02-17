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
  CreateRefundController,
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/picpay/interface';
import {
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  PaymentsService,
  KAFKA_TOPICS,
  PicpayClientService,
} from '@zro/picpay/infrastructure';

export type CreateRefundKafkaRequest = KafkaMessage<CreateRefundRequest>;

export type CreateRefundKafkaResponse = KafkaResponse<CreateRefundResponse>;

@Controller()
@MicroserviceController()
export class CreateRefundMicroserviceController {
  constructor(private readonly picpayClientService: PicpayClientService) {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.REFUND)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreateRefundMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateRefundRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateRefundKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateRefundRequest(message);

    logger.info('Create PicPay refund.', { payload });

    const service = new PaymentsService(this.picpayClientService);

    const controller = new CreateRefundController(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
    );

    // Create refund
    const refund = await controller.execute(payload);

    logger.info('Refund created.', { refund });

    return {
      ctx,
      value: refund,
    };
  }
}
