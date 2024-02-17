import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateDecodedPixAccountKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateDecodedPixAccountRequest,
  CreateDecodedPixAccountResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DECODED_PIX_ACCOUNT.CREATE;

/**
 * DecodedPixAccount microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateDecodedPixAccountServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: CreateDecodedPixAccountServiceKafka.name,
    });
  }

  /**
   * Call DecodedPixAccount microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateDecodedPixAccountRequest,
  ): Promise<CreateDecodedPixAccountResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateDecodedPixAccountKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send DecodedPixAccount message.', { data });

    // Call PixPayment microservice.
    const result = await this.kafkaService.send<
      CreateDecodedPixAccountResponse,
      CreateDecodedPixAccountKafkaRequest
    >(SERVICE, data);

    logger.debug('Received DecodedPixAccount message.', { result });

    return result;
  }
}
