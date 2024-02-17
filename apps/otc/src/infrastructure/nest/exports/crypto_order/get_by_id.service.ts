import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCryptoOrderByIdRequest,
  GetCryptoOrderByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetCryptoOrderByIdKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * GetById CryptoOrder.
 */
const SERVICE = KAFKA_TOPICS.CRYPTO_ORDER.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetCryptoOrderByIdServiceKafka {
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
      context: GetCryptoOrderByIdServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetCryptoOrderByIdRequest,
  ): Promise<GetCryptoOrderByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetCryptoOrderByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('GetById cryptoOrder message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetCryptoOrderByIdResponse,
      GetCryptoOrderByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('GetById cryptoOrder message.', result);

    return result;
  }
}
