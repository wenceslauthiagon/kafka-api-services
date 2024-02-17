import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  VerifyCodePixKeyKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  VerifyCodePixKeyRequest,
  VerifyCodePixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.VERIFY_CODE;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class VerifyCodePixKeyServiceKafka {
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
    this.logger = logger.child({ context: VerifyCodePixKeyServiceKafka.name });
  }

  /**
   * Call pixKeys microservice to verify a pix key code.
   * @param payload Data.
   */
  async execute(
    payload: VerifyCodePixKeyRequest,
  ): Promise<VerifyCodePixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: VerifyCodePixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send pixKey message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      VerifyCodePixKeyResponse,
      VerifyCodePixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
