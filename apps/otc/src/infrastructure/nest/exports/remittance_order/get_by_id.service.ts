import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetRemittanceOrderByIdKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  GetRemittanceOrderByIdRequest,
  GetRemittanceOrderByIdResponse,
} from '@zro/otc/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.REMITTANCE_ORDER.GET_BY_ID;

/**
 * Remittance order microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetRemittanceOrderByIdServiceKafka {
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
      context: GetRemittanceOrderByIdServiceKafka.name,
    });
  }

  /**
   * Call remittance order microservice to getById.
   * @param payload Data.
   */
  async execute(
    payload: GetRemittanceOrderByIdRequest,
  ): Promise<GetRemittanceOrderByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get remittance order by id payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetRemittanceOrderByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call remittance order microservice.
    const result = await this.kafkaService.send<
      GetRemittanceOrderByIdResponse,
      GetRemittanceOrderByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get remittance order by id message.', {
      result,
    });

    return result;
  }
}
