import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetByIdPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  GetByIdPixKeyRequest,
  GetByIdPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.GET_BY_ID;

/**
 * Get pix key by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixKeyByIdServiceKafka {
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
    this.logger = logger.child({ context: GetPixKeyByIdServiceKafka.name });
  }

  /**
   * Call Decoded pix key microservice to get by id.
   * @param payload Data.
   */
  async execute(payload: GetByIdPixKeyRequest): Promise<GetByIdPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetByIdPixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get pixKey by id message.', { data });

    // Call pix key microservice.
    const result = await this.kafkaService.send<
      GetByIdPixKeyResponse,
      GetByIdPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pix key message.', { result });

    return result;
  }
}
