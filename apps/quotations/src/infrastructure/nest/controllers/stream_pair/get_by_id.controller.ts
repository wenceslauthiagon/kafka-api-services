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
  GetStreamPairByIdController,
  GetStreamPairByIdRequest,
  GetStreamPairByIdResponse,
} from '@zro/quotations/interface';

export type GetStreamPairByIdKafkaRequest =
  KafkaMessage<GetStreamPairByIdRequest>;

export type GetStreamPairByIdKafkaResponse =
  KafkaResponse<GetStreamPairByIdResponse>;

/**
 * Get quotation controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetStreamPairByIdMicroserviceController {
  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.STREAM_PAIR.GET_BY_ID)
  async execute(
    @LoggerParam(GetStreamPairByIdMicroserviceController)
    logger: Logger,
    @RepositoryParam(StreamPairDatabaseRepository)
    streamPairRepository: StreamPairRepository,
    @Payload('value')
    message: GetStreamPairByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetStreamPairByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetStreamPairByIdRequest(message);

    logger.debug('Get stream pair payload.', { payload });

    // Get quotation controller.
    const controller = new GetStreamPairByIdController(
      logger,
      streamPairRepository,
    );

    const result = await controller.execute(payload);

    logger.debug('Got stream pair result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
