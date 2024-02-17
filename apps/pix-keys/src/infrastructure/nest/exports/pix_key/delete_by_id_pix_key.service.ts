import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeleteByIdPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  DeleteByIdPixKeyRequest,
  DeleteByIdPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.DELETE_BY_ID;

/**
 * Delete pix key microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DeleteByIdPixKeyServiceKafka {
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
    this.logger = logger.child({ context: DeleteByIdPixKeyServiceKafka.name });
  }

  /**
   * Call pixKeys microservice to delete a pix key by ID.
   * @param payload Data.
   */
  async execute(
    payload: DeleteByIdPixKeyRequest,
  ): Promise<DeleteByIdPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DeleteByIdPixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Delete pix key message.', { data });

    // Call delete PixKey microservice.
    const result = await this.kafkaService.send<
      DeleteByIdPixKeyResponse,
      DeleteByIdPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pix key message.', { result });

    return result;
  }
}
