import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  CacheTTL,
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
  GetQuotationByIdController,
  GetQuotationByIdRequest,
  GetQuotationByIdResponse,
} from '@zro/quotations/interface';

export type GetQuotationByIdKafkaRequest =
  KafkaMessage<GetQuotationByIdRequest>;

export type GetQuotationByIdKafkaResponse =
  KafkaResponse<GetQuotationByIdResponse>;

/**
 * Get quotation controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetQuotationByIdMicroserviceController {
  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QUOTATION.GET_BY_ID)
  async execute(
    @RepositoryParam(QuotationDatabaseRepository)
    quotationRepository: QuotationRepository,
    @LoggerParam(GetQuotationByIdMicroserviceController)
    logger: Logger,
    @Payload('value')
    message: GetQuotationByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetQuotationByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetQuotationByIdRequest(message);

    logger.info('Get quotation payload.', { payload });

    // Get quotation controller.
    const controller = new GetQuotationByIdController(
      logger,
      quotationRepository,
    );

    const result = await controller.execute(payload);

    logger.info('Got quotation result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
