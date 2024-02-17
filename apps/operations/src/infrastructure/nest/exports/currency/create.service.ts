import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateCurrencyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  CreateCurrencyRequest,
  CreateCurrencyResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.CURRENCY.CREATE;

/**
 * Create currency kafka microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateCurrencyServiceKafka {
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
    this.logger = logger.child({ context: CreateCurrencyServiceKafka.name });
  }

  /**
   * Call operations microservice to create a currency.
   * @param payload Data.
   */
  async execute(
    payload: CreateCurrencyRequest,
  ): Promise<CreateCurrencyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send create currency payload.', { payload });

    // Request Kafka message.
    const data: CreateCurrencyKafkaRequest = {
      key: `${payload.tag ?? payload.symbol}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call create currency microservice.
    const result = await this.kafkaService.send<
      CreateCurrencyResponse,
      CreateCurrencyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received create currency message.', { result });

    return result;
  }
}
