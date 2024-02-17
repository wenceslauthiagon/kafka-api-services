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
import { CurrencyRepository } from '@zro/operations/domain';
import {
  GetCurrencyBySymbolController,
  GetCurrencyBySymbolRequest,
  GetCurrencyBySymbolResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetCurrencyBySymbolKafkaRequest =
  KafkaMessage<GetCurrencyBySymbolRequest>;
export type GetCurrencyBySymbolKafkaResponse =
  KafkaResponse<GetCurrencyBySymbolResponse>;

/**
 * Currency controller.
 */
@Controller()
@CacheTTL(3600) // 1h
@MicroserviceController()
export class GetCurrencyBySymbolMicroserviceController {
  /**
   * Consumer of get by currency symbol.
   *
   * @param currencyRepository Currency repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CURRENCY.GET_BY_SYMBOL)
  async execute(
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(GetCurrencyBySymbolMicroserviceController) logger: Logger,
    @Payload('value') message: GetCurrencyBySymbolRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCurrencyBySymbolKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCurrencyBySymbolRequest(message);

    // Create and call get currency by symbol controller.
    const controller = new GetCurrencyBySymbolController(
      logger,
      currencyRepository,
    );

    const currency = await controller.execute(payload);

    logger.info('Currency found.', { currency });

    return {
      ctx,
      value: currency,
    };
  }
}
