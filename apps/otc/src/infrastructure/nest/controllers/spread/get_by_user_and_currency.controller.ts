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
  GetSpreadByUserAndCurrencyController,
  GetSpreadByUserAndCurrencyRequest,
  GetSpreadByUserAndCurrencyResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SpreadDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetSpreadByUserAndCurrencyKafkaRequest =
  KafkaMessage<GetSpreadByUserAndCurrencyRequest>;

export type GetSpreadByUserAndCurrencyKafkaResponse =
  KafkaResponse<GetSpreadByUserAndCurrencyResponse>;

/**
 * Spread controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetSpreadByUserAndCurrencyMicroserviceController {
  /**
   * Consumer of get spread by user and currency.
   *
   * @param spreadRepository Spread repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SPREAD.GET_BY_USER_AND_CURRENCY)
  async execute(
    @RepositoryParam(SpreadDatabaseRepository)
    spreadRepository: SpreadRepository,
    @LoggerParam(GetSpreadByUserAndCurrencyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetSpreadByUserAndCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetSpreadByUserAndCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetSpreadByUserAndCurrencyRequest(message);

    // Call get by currency controller.
    const controller = new GetSpreadByUserAndCurrencyController(
      logger,
      spreadRepository,
    );

    const spread = await controller.execute(payload);

    logger.debug('Found spread.', { spread });

    return {
      ctx,
      value: spread,
    };
  }
}
