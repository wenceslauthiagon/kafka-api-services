import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetAllStreamPairKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetAllStreamPairRequest,
  GetAllStreamPairResponse,
} from '@zro/quotations/interface';

/**
 * Get stream pair.
 */
const SERVICE = KAFKA_TOPICS.STREAM_PAIR.GET_ALL;

@KafkaSubscribeService(SERVICE)
export class GetAllStreamPairServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetAllStreamPairServiceKafka.name });
  }

  /**
   * Call stream pair microservice
   * @param payload Data.
   */
  async execute(
    payload: GetAllStreamPairRequest,
  ): Promise<GetAllStreamPairResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllStreamPairKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get stream pair message.', { data });

    // Call stream pair microservice.
    const result = await this.kafkaService.send<
      GetAllStreamPairResponse,
      GetAllStreamPairKafkaRequest
    >(SERVICE, data);

    logger.debug('Get stream pair response.', { result });

    return result;
  }
}
