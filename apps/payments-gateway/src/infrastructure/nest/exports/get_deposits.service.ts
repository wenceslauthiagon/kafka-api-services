import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetDepositsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetDepositsRequest,
  GetDepositsResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DEPOSIT.GET_ALL;

/**
 * Get deposits microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetDepositsServiceKafka {
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
      context: GetDepositsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetDeposits.
   * @param payload Data.
   */
  async execute(payload: GetDepositsRequest): Promise<GetDepositsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetDepositsKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get deposits message.', { data });

    // Call GetDeposits microservice.
    const result = await this.kafkaService.send<
      GetDepositsResponse,
      GetDepositsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get deposits message.', { result });

    return result;
  }
}
