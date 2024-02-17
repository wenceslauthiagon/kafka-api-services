import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { QuotationRepository } from '@zro/quotations/domain';
import {
  KAFKA_TOPICS,
  QuotationDatabaseRepository,
} from '@zro/quotations/infrastructure';
import {
  CreateQuotationController,
  CreateQuotationRequest,
  CreateQuotationResponse,
} from '@zro/quotations/interface';

export type CreateQuotationKafkaRequest = KafkaMessage<CreateQuotationRequest>;

export type CreateQuotationKafkaResponse =
  KafkaResponse<CreateQuotationResponse>;

/**
 * Create quotation controller.
 */
@Controller()
@MicroserviceController()
export class CreateQuotationMicroserviceController {
  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QUOTATION.CREATE)
  async execute(
    @RepositoryParam(QuotationDatabaseRepository)
    quotationRepository: QuotationRepository,
    @LoggerParam(CreateQuotationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateQuotationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateQuotationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateQuotationRequest(message);

    logger.info('Create quotation payload.', { payload });

    // Create quotation controller.
    const controller = new CreateQuotationController(
      logger,
      quotationRepository,
    );

    const result = await controller.execute(payload);

    logger.info('Created quotation.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
