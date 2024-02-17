import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DismissByIdPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  DismissByIdPixKeyRequest,
  DismissByIdPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.DISMISS_BY_ID;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DismissByIdPixKeyServiceKafka {
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
    this.logger = logger.child({ context: DismissByIdPixKeyServiceKafka.name });
  }

  /**
   * Call pixKeys microservice to dismiss a pix key by ID.
   * @param payload Data.
   */
  async execute(
    payload: DismissByIdPixKeyRequest,
  ): Promise<DismissByIdPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DismissByIdPixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Dismiss pix key by id message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      DismissByIdPixKeyResponse,
      DismissByIdPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pix key message.', { result });

    return result;
  }
}
