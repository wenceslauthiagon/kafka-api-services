import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWithdrawalByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WITHDRAWAL.GET_BY_ID;

/**
 * Get withdrawal by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWithdrawalByIdServiceKafka {
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
      context: GetWithdrawalByIdServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetWithdrawalById.
   * @param payload Data.
   */
  async execute(
    payload: GetTransactionByIdRequest,
  ): Promise<TransactionResponseItem> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetWithdrawalByIdKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get withdrawal by id message.', { data });

    // Call GetWithdrawalById microservice.
    const result = await this.kafkaService.send<
      TransactionResponseItem,
      GetWithdrawalByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get withdrawal by id message.', { result });

    return result;
  }
}
