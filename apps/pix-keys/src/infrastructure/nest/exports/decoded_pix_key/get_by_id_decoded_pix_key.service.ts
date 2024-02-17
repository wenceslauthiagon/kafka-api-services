import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetByIdDecodedPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  GetByIdDecodedPixKeyRequest,
  GetByIdDecodedPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DECODED_KEY.GET_BY_ID;

/**
 * Get by id decoded pix key microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetByIdDecodedPixKeyServiceKafka {
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
      context: GetByIdDecodedPixKeyServiceKafka.name,
    });
  }

  /**
   * Call Decoded pix key microservice to get by id.
   * @param payload Data.
   */
  async execute(
    payload: GetByIdDecodedPixKeyRequest,
  ): Promise<GetByIdDecodedPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetByIdDecodedPixKeyKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send get decoded pix key by id message.', { data });

    // Call decode pix key microservice.
    const result = await this.kafkaService.send<
      GetByIdDecodedPixKeyResponse,
      GetByIdDecodedPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received decoded pix key message.', { result });

    return result;
  }
}
