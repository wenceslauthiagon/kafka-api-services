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
import { SpreadRepository } from '@zro/otc/domain';
import {
  GetSpreadsByUserAndCurrenciesController,
  GetSpreadsByUserAndCurrenciesRequest,
  GetSpreadsByUserAndCurrenciesResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SpreadDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetSpreadsByUserAndCurrenciesKafkaRequest =
  KafkaMessage<GetSpreadsByUserAndCurrenciesRequest>;

export type GetSpreadsByUserAndCurrenciesKafkaResponse = KafkaResponse<
  GetSpreadsByUserAndCurrenciesResponse[]
>;

/**
 * Spread controller.
 */
@Controller()
@CacheTTL(3600) // 1h
@MicroserviceController()
export class GetSpreadsByUserAndCurrenciesMicroserviceController {
  /**
   * Consumer of get spreads by user and currencies.
   *
   * @param spreadRepository Spread repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SPREAD.GET_BY_USER_AND_CURRENCIES)
  async execute(
    @RepositoryParam(SpreadDatabaseRepository)
    spreadRepository: SpreadRepository,
    @LoggerParam(GetSpreadsByUserAndCurrenciesMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetSpreadsByUserAndCurrenciesRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetSpreadsByUserAndCurrenciesKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetSpreadsByUserAndCurrenciesRequest(message);

    // Call get by currencies controller.
    const controller = new GetSpreadsByUserAndCurrenciesController(
      logger,
      spreadRepository,
    );

    const spreads = await controller.execute(payload);

    logger.debug('Found spreads.', { spreads });

    return {
      ctx,
      value: spreads,
    };
  }
}
