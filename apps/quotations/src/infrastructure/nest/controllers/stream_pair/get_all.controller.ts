import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { StreamPairRepository } from '@zro/quotations/domain';
import {
  KAFKA_TOPICS,
  StreamPairDatabaseRepository,
} from '@zro/quotations/infrastructure';
import {
  GetAllStreamPairController,
  GetAllStreamPairRequest,
  GetAllStreamPairResponse,
} from '@zro/quotations/interface';

export type GetAllStreamPairKafkaRequest =
  KafkaMessage<GetAllStreamPairRequest>;

export type GetAllStreamPairKafkaResponse =
  KafkaResponse<GetAllStreamPairResponse>;

/**
 * Get stream pairs controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetAllStreamPairMicroserviceController {
  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.STREAM_PAIR.GET_ALL)
  async execute(
    @RepositoryParam(StreamPairDatabaseRepository)
    streamPairRepository: StreamPairRepository,
    @LoggerParam(GetAllStreamPairMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllStreamPairRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllStreamPairKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllStreamPairRequest(message);

    logger.debug('Get stream pair payload.', { payload });

    // Get stream pair controller.
    const controller = new GetAllStreamPairController(
      logger,
      streamPairRepository,
    );

    const result = await controller.execute(payload);

    logger.debug('Get stream pair result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
