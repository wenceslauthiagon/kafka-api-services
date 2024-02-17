import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPixKeyByUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  GetAllPixKeyByUserRequest,
  GetAllPixKeyByUserResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.GET_ALL_BY_USER;

/**
 * Get all pix key by user microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPixKeyByUserServiceKafka {
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
      context: GetAllPixKeyByUserServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to getAll pix key.
   * @param payload Data.
   */
  async execute(
    payload: GetAllPixKeyByUserRequest,
  ): Promise<GetAllPixKeyByUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPixKeyByUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get all pix key message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      GetAllPixKeyByUserResponse,
      GetAllPixKeyByUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pix key message.', { result });

    return result;
  }
}
