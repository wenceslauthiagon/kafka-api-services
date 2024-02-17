import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetSystemByNameRequest,
  GetSystemByNameResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetSystemByNameKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * GetByName System.
 */
const SERVICE = KAFKA_TOPICS.SYSTEM.GET_BY_NAME;

@KafkaSubscribeService(SERVICE)
export class GetSystemByNameServiceKafka {
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
    this.logger = logger.child({
      context: GetSystemByNameServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetSystemByNameRequest,
  ): Promise<GetSystemByNameResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetSystemByNameKafkaRequest = {
      key: payload.name,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Got system by name message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetSystemByNameResponse,
      GetSystemByNameKafkaRequest
    >(SERVICE, data);

    logger.debug('Got system by name message.', result);

    return result;
  }
}
