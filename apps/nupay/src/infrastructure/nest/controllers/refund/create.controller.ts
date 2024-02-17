import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import {
  KAFKA_TOPICS,
  RefundService,
  NuPayClientService,
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
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
  CreateRefundController,
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/nupay/interface';

export type CreateRefundKafkaRequest = KafkaMessage<CreateRefundRequest>;

export type CreateRefundKafkaResponse = KafkaResponse<CreateRefundResponse>;

@Controller()
@MicroserviceController()
export class CreateRefundMicroserviceController {
  constructor(private nuPayClientService: NuPayClientService) {}

  @KafkaMessagePattern(KAFKA_TOPICS.REFUND.CREATE)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreateRefundMicroserviceController)
    logger: Logger,
    @Payload('value') request: CreateRefundRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateRefundKafkaResponse> {
    logger.debug('Received message.', { value: request });

    // Parse kafka message.
    const payload = request;

    logger.info('Create NuPay refund.', { payload });

    const service = new RefundService(this.nuPayClientService);

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
