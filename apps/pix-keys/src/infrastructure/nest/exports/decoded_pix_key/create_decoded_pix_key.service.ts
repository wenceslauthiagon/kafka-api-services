import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateDecodedPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  CreateDecodedPixKeyRequest,
  CreateDecodedPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DECODED_KEY.CREATE;

/**
 * Create decoded pix key microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateDecodedPixKeyServiceKafka {
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
      context: CreateDecodedPixKeyServiceKafka.name,
    });
  }

  /**
   * Call Decoded pix key microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateDecodedPixKeyRequest,
  ): Promise<CreateDecodedPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateDecodedPixKeyKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send decoded pix key message.', { data });

    // Call decode pix key microservice.
    const result = await this.kafkaService.send<
      CreateDecodedPixKeyResponse,
      CreateDecodedPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received decoded pix key message.', { result });

    return result;
  }
}
