import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCryptoPriceByCurrencyAndDateKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import {
  GetCryptoPriceByCurrencyAndDateRequest,
  GetCryptoPriceByCurrencyAndDateResponse,
} from '@zro/otc/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.CRYPTO.GET_PRICE_BY_CURRENCY_AND_DATE;

/**
 * OTC microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetCryptoPriceByCurrencyAndDateServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetCryptoPriceByCurrencyAndDateServiceKafka.name,
    });
  }

  /**
   * Call otc microservice to get crypto price by currency and data.
   * @param payload Data.
   */
  async execute(
    payload: GetCryptoPriceByCurrencyAndDateRequest,
  ): Promise<GetCryptoPriceByCurrencyAndDateResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetCryptoPriceByCurrencyAndDateKafkaRequest = {
      key: `${payload.currencySymbol}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send get crypto price by currency and data.', { data });

    // Call get crypto price by currency and data microservice.
    const result = await this.kafkaService.send<
      GetCryptoPriceByCurrencyAndDateResponse,
      GetCryptoPriceByCurrencyAndDateKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get crypto price by currency and data message.', {
      result,
    });

    return result;
  }
}
