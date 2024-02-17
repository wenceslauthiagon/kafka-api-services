import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreatePixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  CreatePixKeyRequest,
  CreatePixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.CREATE;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreatePixKeyServiceKafka {
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
    this.logger = logger.child({ context: CreatePixKeyServiceKafka.name });
  }

  /**
   * Call pixKeys microservice to create a pix key.
   * @param payload Data.
   */
  async execute(payload: CreatePixKeyRequest): Promise<CreatePixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreatePixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create pix key message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      CreatePixKeyResponse,
      CreatePixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', result);

    return result;
  }
}
