import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { TaxRepository } from '@zro/quotations/domain';
import {
  GetAllTaxController,
  GetAllTaxResponse,
  GetAllTaxRequest,
} from '@zro/quotations/interface';
import {
  KAFKA_TOPICS,
  TaxDatabaseRepository,
} from '@zro/quotations/infrastructure';

export type GetAllTaxKafkaRequest = KafkaMessage<GetAllTaxRequest>;

export type GetAllTaxKafkaResponse = KafkaResponse<GetAllTaxResponse>;

/**
 * Tax controller.
 */
@Controller()
@CacheTTL(86400) // 24h
@MicroserviceController()
export class GetAllTaxMicroserviceController {
  /**
   * Consumer of get taxes.
   *
   * @param taxRepository Tax repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.TAX.GET_ALL)
  async execute(
    @RepositoryParam(TaxDatabaseRepository)
    taxRepository: TaxRepository,
    @LoggerParam(GetAllTaxMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllTaxRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllTaxKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllTaxRequest(message);

    // Create and call get taxes controller.
    const controller = new GetAllTaxController(logger, taxRepository);

    // Get taxes
    const taxes = await controller.execute(payload);

    logger.debug('Taxes found.', { taxes });

    return {
      ctx,
      value: taxes,
    };
  }
}
