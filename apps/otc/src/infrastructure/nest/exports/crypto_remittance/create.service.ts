import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateCryptoRemittanceRequest,
  CreateCryptoRemittanceResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CreateCryptoRemittanceKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Create CryptoRemittance.
 */
const SERVICE = KAFKA_TOPICS.CRYPTO_REMITTANCE.CREATE;

@KafkaSubscribeService(SERVICE)
export class CreateCryptoRemittanceServiceKafka {
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
      context: CreateCryptoRemittanceServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateCryptoRemittanceKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create cryptoRemittance message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      CreateCryptoRemittanceResponse,
      CreateCryptoRemittanceKafkaRequest
    >(SERVICE, data);

    logger.debug('Created cryptoRemittance message.', result);

    return result;
  }
}
