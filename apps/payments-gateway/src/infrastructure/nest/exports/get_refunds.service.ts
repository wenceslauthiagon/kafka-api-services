import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetRefundsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetRefundsRequest,
  GetRefundsResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.REFUND.GET_ALL;

/**
 * Get refunds microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetRefundsServiceKafka {
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
      context: GetRefundsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetRefunds.
   * @param payload Data.
   */
  async execute(payload: GetRefundsRequest): Promise<GetRefundsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetRefundsKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get refunds message.', { data });

    // Call GetRefunds microservice.
    const result = await this.kafkaService.send<
      GetRefundsResponse,
      GetRefundsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get refunds message.', { result });

    return result;
  }
}
