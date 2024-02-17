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
  GetSpreadByIdController,
  GetSpreadByIdRequest as GetSpreadByIdRequest,
  GetSpreadByIdResponse as GetSpreadByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SpreadDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetSpreadByIdKafkaRequest = KafkaMessage<GetSpreadByIdRequest>;

export type GetSpreadByIdKafkaResponse = KafkaResponse<GetSpreadByIdResponse>;

/**
 * Spread controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetSpreadByIdMicroserviceController {
  /**
   * Consumer of get spread by id.
   *
   * @param spreadRepository Spread repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SPREAD.GET_BY_ID)
  async execute(
    @RepositoryParam(SpreadDatabaseRepository)
    spreadRepository: SpreadRepository,
    @LoggerParam(GetSpreadByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetSpreadByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetSpreadByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetSpreadByIdRequest(message);

    // GetById and call get by id spread controller.
    const controller = new GetSpreadByIdController(logger, spreadRepository);

    const spread = await controller.execute(payload);

    logger.debug('Found spread.', { spread });

    return {
      ctx,
      value: spread,
    };
  }
}
