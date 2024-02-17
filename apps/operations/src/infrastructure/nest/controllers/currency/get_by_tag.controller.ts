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
  GetCurrencyByTagController,
  GetCurrencyByTagRequest,
  GetCurrencyByTagResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetCurrencyByTagKafkaRequest =
  KafkaMessage<GetCurrencyByTagRequest>;

export type GetCurrencyByTagKafkaResponse =
  KafkaResponse<GetCurrencyByTagResponse>;

/**
 * Currency controller.
 */
@Controller()
@CacheTTL(3600) // 1h
@MicroserviceController()
export class GetCurrencyByTagMicroserviceController {
  /**
   * Consumer of get by currency symbol.
   *
   * @param currencyRepository Currency repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CURRENCY.GET_BY_TAG)
  async execute(
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(GetCurrencyByTagMicroserviceController) logger: Logger,
    @Payload('value') message: GetCurrencyByTagRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCurrencyByTagKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCurrencyByTagRequest(message);

    // Create and call get currency by symbol controller.
    const controller = new GetCurrencyByTagController(
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
