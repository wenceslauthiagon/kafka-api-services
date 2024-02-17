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
  GetAllSpreadController,
  GetAllSpreadRequest,
  GetAllSpreadResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SpreadDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetAllSpreadKafkaRequest = KafkaMessage<GetAllSpreadRequest>;

export type GetAllSpreadKafkaResponse = KafkaResponse<GetAllSpreadResponse>;

/**
 * Spread controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetAllSpreadMicroserviceController {
  /**
   * Consumer of getAll spread.
   *
   * @param spreadRepository Spread repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SPREAD.GET_ALL)
  async execute(
    @RepositoryParam(SpreadDatabaseRepository)
    spreadRepository: SpreadRepository,
    @LoggerParam(GetAllSpreadMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllSpreadRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllSpreadKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllSpreadRequest(message);

    // GetAll and call getAll spread controller.
    const controller = new GetAllSpreadController(logger, spreadRepository);

    const spread = await controller.execute(payload);

    logger.debug('Found spreads.', { spread });

    return {
      ctx,
      value: spread,
    };
  }
}
