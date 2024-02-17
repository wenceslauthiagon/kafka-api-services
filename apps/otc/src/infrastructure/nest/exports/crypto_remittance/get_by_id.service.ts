import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCryptoRemittanceByIdRequest,
  GetCryptoRemittanceByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetCryptoRemittanceByIdKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * GetById CryptoRemittance.
 */
const SERVICE = KAFKA_TOPICS.CRYPTO_REMITTANCE.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetCryptoRemittanceByIdServiceKafka {
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
      context: GetCryptoRemittanceByIdServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetCryptoRemittanceByIdRequest,
  ): Promise<GetCryptoRemittanceByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetCryptoRemittanceByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('GetById cryptoRemittance message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetCryptoRemittanceByIdResponse,
      GetCryptoRemittanceByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('GetById cryptoRemittance message.', result);

    return result;
  }
}
