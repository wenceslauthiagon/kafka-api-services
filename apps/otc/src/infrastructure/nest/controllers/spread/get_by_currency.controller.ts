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
  GetSpreadByCurrencyController,
  GetSpreadByCurrencyRequest,
  GetSpreadByCurrencyResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SpreadDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetSpreadByCurrencyKafkaRequest =
  KafkaMessage<GetSpreadByCurrencyRequest>;

export type GetSpreadByCurrencyKafkaResponse =
  KafkaResponse<GetSpreadByCurrencyResponse>;

/**
 * Spread controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetSpreadByCurrencyMicroserviceController {
  /**
   * Consumer of get spread by currency.
   *
   * @param spreadRepository Spread repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SPREAD.GET_BY_CURRENCY)
  async execute(
    @RepositoryParam(SpreadDatabaseRepository)
    spreadRepository: SpreadRepository,
    @LoggerParam(GetSpreadByCurrencyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetSpreadByCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetSpreadByCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetSpreadByCurrencyRequest(message);

    // Call get by currency controller.
    const controller = new GetSpreadByCurrencyController(
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
