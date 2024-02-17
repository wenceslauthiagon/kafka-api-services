import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UpdateStateByIdDecodedPixKeyKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  UpdateStateByIdDecodedPixKeyRequest,
  UpdateStateByIdDecodedPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DECODED_KEY.UPDATE_STATE_BY_ID;

/**
 * Update state by id decoded pix key microservice.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateStateByIdDecodedPixKeyServiceKafka {
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
      context: UpdateStateByIdDecodedPixKeyServiceKafka.name,
    });
  }

  /**
   * Call Decoded pix key microservice to update state by id.
   * @param payload Data.
   */
  async execute(
    payload: UpdateStateByIdDecodedPixKeyRequest,
  ): Promise<UpdateStateByIdDecodedPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateStateByIdDecodedPixKeyKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send update decoded pix key state by id message.', { data });

    // Call decode pix key microservice.
    const result = await this.kafkaService.send<
      UpdateStateByIdDecodedPixKeyResponse,
      UpdateStateByIdDecodedPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received decoded pix key message.', { result });

    return result;
  }
}
