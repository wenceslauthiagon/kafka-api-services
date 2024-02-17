import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetDepositByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DEPOSIT.GET_BY_ID;

/**
 * Get deposit by ID microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetDepositByIdServiceKafka {
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
      context: GetDepositByIdServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetDepositById.
   * @param payload Data.
   */
  async execute(
    payload: GetTransactionByIdRequest,
  ): Promise<TransactionResponseItem> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetDepositByIdKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send get deposit by ID message.', { data });

    // Call GetDepositById Payment microservice.
    const result = await this.kafkaService.send<
      TransactionResponseItem,
      GetDepositByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get deposit by ID message.', { result });

    return result;
  }
}
