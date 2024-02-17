import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import { KAFKA_TOPICS } from '@zro/otc/infrastructure';
import {
  GetAllRemittanceOrdersByFilterRequest,
  GetAllRemittanceOrdersByFilterResponse,
} from '@zro/otc/interface';
import { GetAllRemittanceOrdersByFilterKafkaRequest } from '@zro/otc/infrastructure';

// Service topic
const SERVICE = KAFKA_TOPICS.REMITTANCE_ORDER.GET_ALL_BY_FILTER;

/**
 * Remittance orders microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllRemittanceOrdersByFilterServiceKafka {
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
      context: GetAllRemittanceOrdersByFilterServiceKafka.name,
    });
  }

  /**
   * Call remittance order microservice to getAllByFilter.
   * @param payload Data.
   */
  async execute(
    payload: GetAllRemittanceOrdersByFilterRequest,
  ): Promise<GetAllRemittanceOrdersByFilterResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get remittance orders by filter payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetAllRemittanceOrdersByFilterKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call remittance order microservice.
    const result = await this.kafkaService.send<
      GetAllRemittanceOrdersByFilterResponse,
      GetAllRemittanceOrdersByFilterKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get remittance orders by filter message.', {
      result,
    });

    return result;
  }
}
