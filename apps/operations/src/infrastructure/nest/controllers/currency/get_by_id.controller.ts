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
  GetCurrencyByIdController,
  GetCurrencyByIdRequest,
  GetCurrencyByIdResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetCurrencyByIdKafkaRequest = KafkaMessage<GetCurrencyByIdRequest>;
export type GetCurrencyByIdKafkaResponse =
  KafkaResponse<GetCurrencyByIdResponse>;

/**
 * Currency controller.
 */
@Controller()
@CacheTTL(3600) // 1h
@MicroserviceController()
export class GetCurrencyByIdMicroserviceController {
  /**
   * Consumer of get by currency id.
   *
   * @param currencyRepository Currency repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CURRENCY.GET_BY_ID)
  async execute(
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(GetCurrencyByIdMicroserviceController) logger: Logger,
    @Payload('value') message: GetCurrencyByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCurrencyByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCurrencyByIdRequest(message);

    // Create and call get currency by id controller.
    const controller = new GetCurrencyByIdController(
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
