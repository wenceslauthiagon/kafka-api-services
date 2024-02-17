import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllCurrencyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllCurrencyRequest,
  GetAllCurrencyResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.CURRENCY.GET_ALL;

/**
 * Get all currencies kafka microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllCurrencyServiceKafka {
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
    this.logger = logger.child({ context: GetAllCurrencyServiceKafka.name });
  }

  /**
   * Call operations microservice to get all currencies.
   * @param payload Data.
   */
  async execute(
    payload: GetAllCurrencyRequest,
  ): Promise<GetAllCurrencyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get all currencies payload.', { payload });

    // Request Kafka message.
    const data: GetAllCurrencyKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get all currency microservice.
    const result = await this.kafkaService.send<
      GetAllCurrencyResponse,
      GetAllCurrencyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get all currencies message.', { result });

    return result;
  }
}
