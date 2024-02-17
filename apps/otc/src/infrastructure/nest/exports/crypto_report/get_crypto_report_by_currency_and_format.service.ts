import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCryptoReportByCurrencyAndFormatKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import {
  GetCryptoReportByCurrencyAndFormatRequest,
  GetCryptoReportByCurrencyAndFormatResponse,
} from '@zro/otc/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.CRYPTO_REPORT.GET_BY_CURRENCY_AND_FORMAT;

/**
 * OTC microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetCryptoReportByCurrencyAndFormatServiceKafka {
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
      context: GetCryptoReportByCurrencyAndFormatServiceKafka.name,
    });
  }

  /**
   * Call otc microservice to get crypto report by currency and format.
   * @param payload Data.
   */
  async execute(
    payload: GetCryptoReportByCurrencyAndFormatRequest,
  ): Promise<GetCryptoReportByCurrencyAndFormatResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetCryptoReportByCurrencyAndFormatKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send get crypto report by currency and format.', { data });

    // Call get crypto report by currency and format microservice.
    const result = await this.kafkaService.send<
      GetCryptoReportByCurrencyAndFormatResponse,
      GetCryptoReportByCurrencyAndFormatKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get crypto report by currency and format message.', {
      result,
    });

    return result;
  }
}
