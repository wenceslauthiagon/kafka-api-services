import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateCryptoRemittanceRequest,
  UpdateCryptoRemittanceResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  UpdateCryptoRemittanceKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Update CryptoRemittance.
 */
const SERVICE = KAFKA_TOPICS.CRYPTO_REMITTANCE.UPDATE;

@KafkaSubscribeService(SERVICE)
export class UpdateCryptoRemittanceServiceKafka {
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
      context: UpdateCryptoRemittanceServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: UpdateCryptoRemittanceRequest,
  ): Promise<UpdateCryptoRemittanceResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateCryptoRemittanceKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Update cryptoRemittance message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      UpdateCryptoRemittanceResponse,
      UpdateCryptoRemittanceKafkaRequest
    >(SERVICE, data);

    logger.debug('Updated cryptoRemittance message.', result);

    return result;
  }
}
