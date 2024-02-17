import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GenerateExchangeContractWorksheetKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import {
  GenerateExchangeContractWorksheetRequest,
  GenerateExchangeContractWorksheetResponse,
} from '@zro/otc/interface';

// Service topic from Exchange Contract.
const SERVICE = KAFKA_TOPICS.EXCHANGE_CONTRACT.GENERATE_WORKSHEET;

/**
 * ExchangeContract microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GenerateExchangeContractWorksheetServiceKafka {
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
      context: GenerateExchangeContractWorksheetServiceKafka.name,
    });
  }

  /**
   * Call systems microservice to generate worksheet.
   * @param payload Data.
   */
  async execute(
    payload: GenerateExchangeContractWorksheetRequest,
  ): Promise<GenerateExchangeContractWorksheetResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GenerateExchangeContractWorksheetKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send system message.');

    // Call generate ExchangeContract worksheet microservice.
    const result = await this.kafkaService.send<
      GenerateExchangeContractWorksheetResponse,
      GenerateExchangeContractWorksheetKafkaRequest
    >(KAFKA_TOPICS.EXCHANGE_CONTRACT.GENERATE_WORKSHEET, data);

    logger.debug('Received system message.', result);

    return result;
  }
}
