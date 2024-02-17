import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { ExchangeQuotationRepository } from '@zro/otc/domain';
import {
  GetAllExchangeQuotationController,
  GetAllExchangeQuotationRequest,
  GetAllExchangeQuotationResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ExchangeQuotationDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetAllExchangeQuotationKafkaRequest =
  KafkaMessage<GetAllExchangeQuotationRequest>;

export type GetAllExchangeQuotationKafkaResponse =
  KafkaResponse<GetAllExchangeQuotationResponse>;

/**
 * ExchangeQuotation controller.
 */
@Controller()
@MicroserviceController()
export class GetAllExchangeQuotationMicroserviceController {
  /**
   * Consumer of get ExchangeQuotation.
   *
   * @param exchangeQuotationRepository ExchangeQuotation repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.EXCHANGE_QUOTATION.GET_ALL)
  async execute(
    @RepositoryParam(ExchangeQuotationDatabaseRepository)
    exchangeQuotationRepository: ExchangeQuotationRepository,
    @LoggerParam(GetAllExchangeQuotationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllExchangeQuotationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllExchangeQuotationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllExchangeQuotationRequest(message);

    // Create and call get ExchangeQuotations controller.
    const controller = new GetAllExchangeQuotationController(
      logger,
      exchangeQuotationRepository,
    );

    // Get ExchangeQuotations
    const exchangeQuotations = await controller.execute(payload);

    logger.info('ExchangeQuotations found.', { exchangeQuotations });

    return {
      ctx,
      value: exchangeQuotations,
    };
  }
}
