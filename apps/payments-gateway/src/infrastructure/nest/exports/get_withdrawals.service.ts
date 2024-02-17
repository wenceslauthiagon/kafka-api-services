import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWithdrawalsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetWithdrawalsRequest,
  GetWithdrawalsResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WITHDRAWAL.GET_ALL;

/**
 * Get withdrawals microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWithdrawalsServiceKafka {
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
      context: GetWithdrawalsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetWithdrawals.
   * @param payload Data.
   */
  async execute(
    payload: GetWithdrawalsRequest,
  ): Promise<GetWithdrawalsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetWithdrawalsKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get withdrawals message.', { data });

    // Call GetWithdrawals microservice.
    const result = await this.kafkaService.send<
      GetWithdrawalsResponse,
      GetWithdrawalsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get withdrawals message.', { result });

    return result;
  }
}
