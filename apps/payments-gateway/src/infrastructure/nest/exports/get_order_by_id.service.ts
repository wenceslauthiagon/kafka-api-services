import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOrderByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetOrderByIdRequest,
  GetOrderByIdResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ORDER.GET_BY_ID;

/**
 * Get order by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetOrderByIdServiceKafka {
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
      context: GetOrderByIdServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetOrderById.
   * @param payload Data.
   */
  async execute(payload: GetOrderByIdRequest): Promise<GetOrderByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetOrderByIdKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get order by id message.', { data });

    // Call GetOrderById microservice.
    const result = await this.kafkaService.send<
      GetOrderByIdResponse,
      GetOrderByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get order by id message.', { result });

    return result;
  }
}
