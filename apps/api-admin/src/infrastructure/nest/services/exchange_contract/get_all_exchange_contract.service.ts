import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllExchangeContractKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import {
  GetAllExchangeContractRequest,
  GetAllExchangeContractResponse,
} from '@zro/otc/interface';

// Service topic from Exchange Contract.
const SERVICE = KAFKA_TOPICS.EXCHANGE_CONTRACT.GET_ALL;

/**
 * ExchangeContract microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllExchangeContractServiceKafka {
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
      context: GetAllExchangeContractServiceKafka.name,
    });
  }

  /**
   * Call systems microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllExchangeContractRequest,
  ): Promise<GetAllExchangeContractResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllExchangeContractKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send exchange contract message.', { data });

    // Call get All exchange contract microservice.
    const result = await this.kafkaService.send<
      GetAllExchangeContractResponse,
      GetAllExchangeContractKafkaRequest
    >(KAFKA_TOPICS.EXCHANGE_CONTRACT.GET_ALL, data);

    logger.debug('Received exchange contract message.', { result });

    return result;
  }
}
