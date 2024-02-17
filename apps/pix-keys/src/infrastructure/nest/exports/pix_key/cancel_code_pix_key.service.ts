import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CancelCodePixKeyKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  CancelCodePixKeyRequest,
  CancelCodePixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.CANCEL_CODE;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelCodePixKeyServiceKafka {
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
      context: CancelCodePixKeyServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to cancel pix key.
   * @param payload Data.
   * @returns Pix Key.
   */
  async execute(
    payload: CancelCodePixKeyRequest,
  ): Promise<CancelCodePixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelCodePixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send cancel code pix key message.', {
      data,
    });

    // Call PixKey microservice.
    const result = await this.kafkaService.send<
      CancelCodePixKeyResponse,
      CancelCodePixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
