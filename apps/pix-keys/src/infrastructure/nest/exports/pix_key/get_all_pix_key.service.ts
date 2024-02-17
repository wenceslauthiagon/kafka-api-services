import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  GetAllPixKeyRequest,
  GetAllPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.GET_ALL;

/**
 * Get all pix key microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPixKeyServiceKafka {
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
    this.logger = logger.child({ context: GetAllPixKeyServiceKafka.name });
  }

  /**
   * Call pixKeys microservice to getAll pix key.
   * @param payload Data.
   */
  async execute(payload: GetAllPixKeyRequest): Promise<GetAllPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get all pix key message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      GetAllPixKeyResponse,
      GetAllPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pix key message.', { result });

    return result;
  }
}
