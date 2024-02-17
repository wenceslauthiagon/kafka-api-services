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
  GetAllCurrencyController,
  GetAllCurrencyRequest,
  GetAllCurrencyResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetAllCurrencyKafkaRequest = KafkaMessage<GetAllCurrencyRequest>;

export type GetAllCurrencyKafkaResponse = KafkaResponse<GetAllCurrencyResponse>;

/**
 * Currency controller.
 */
@Controller()
@CacheTTL(3600) // 1h
@MicroserviceController()
export class GetAllCurrencyMicroserviceController {
  /**
   * Consumer of get Currencies.
   *
   * @param currencyRepository Currency repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CURRENCY.GET_ALL)
  async execute(
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(GetAllCurrencyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllCurrencyRequest(message);

    // Create and call get Currencies controller.
    const controller = new GetAllCurrencyController(logger, currencyRepository);

    // Get all currencies
    const currencies = await controller.execute(payload);

    logger.info('Currencies found.', { currencies });

    return {
      ctx,
      value: currencies,
    };
  }
}
