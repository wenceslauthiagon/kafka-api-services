import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateCryptoOrderRequest,
  UpdateCryptoOrderResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  UpdateCryptoOrderKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Update CryptoOrder.
 */
const SERVICE = KAFKA_TOPICS.CRYPTO_ORDER.UPDATE;

@KafkaSubscribeService(SERVICE)
export class UpdateCryptoOrderServiceKafka {
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
      context: UpdateCryptoOrderServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: UpdateCryptoOrderRequest,
  ): Promise<UpdateCryptoOrderResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateCryptoOrderKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Update cryptoOrder message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      UpdateCryptoOrderResponse,
      UpdateCryptoOrderKafkaRequest
    >(SERVICE, data);

    logger.debug('Updated cryptoOrder message.', result);

    return result;
  }
}
