import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetSystemByIdRequest,
  GetSystemByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetSystemByIdKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * GetById System.
 */
const SERVICE = KAFKA_TOPICS.SYSTEM.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetSystemByIdServiceKafka {
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
      context: GetSystemByIdServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(payload: GetSystemByIdRequest): Promise<GetSystemByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetSystemByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('GetById system message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetSystemByIdResponse,
      GetSystemByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('GetById system message.', result);

    return result;
  }
}
