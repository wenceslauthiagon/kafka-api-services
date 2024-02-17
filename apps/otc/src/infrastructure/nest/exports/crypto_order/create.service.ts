import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateCryptoOrderRequest,
  CreateCryptoOrderResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CreateCryptoOrderKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Create CryptoOrder.
 */
const SERVICE = KAFKA_TOPICS.CRYPTO_ORDER.CREATE;

@KafkaSubscribeService(SERVICE)
export class CreateCryptoOrderServiceKafka {
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
      context: CreateCryptoOrderServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: CreateCryptoOrderRequest,
  ): Promise<CreateCryptoOrderResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateCryptoOrderKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create cryptoOrder message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      CreateCryptoOrderResponse,
      CreateCryptoOrderKafkaRequest
    >(SERVICE, data);

    logger.debug('Created cryptoOrder message.', result);

    return result;
  }
}
