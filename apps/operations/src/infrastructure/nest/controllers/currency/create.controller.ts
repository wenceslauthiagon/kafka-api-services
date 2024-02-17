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
import { CurrencyRepository } from '@zro/operations/domain';
import {
  CreateCurrencyController,
  CreateCurrencyRequest,
  CreateCurrencyResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';

export type CreateCurrencyKafkaRequest = KafkaMessage<CreateCurrencyRequest>;
export type CreateCurrencyKafkaResponse = KafkaResponse<CreateCurrencyResponse>;

/**
 * Currency controller.
 */
@Controller()
@MicroserviceController()
export class CreateCurrencyMicroserviceController {
  /**
   * Consumer of create currency.
   *
   * @param currencyRepository Currency repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CURRENCY.CREATE)
  async execute(
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @LoggerParam(CreateCurrencyMicroserviceController) logger: Logger,
    @Payload('value') message: CreateCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateCurrencyRequest(message);

    // Create and call create currency controller.
    const controller = new CreateCurrencyController(logger, currencyRepository);

    const currency = await controller.execute(payload);

    logger.info('Currency created.', { currency });

    return {
      ctx,
      value: currency,
    };
  }
}
