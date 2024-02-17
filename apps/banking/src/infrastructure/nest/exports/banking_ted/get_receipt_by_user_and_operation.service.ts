import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetBankingTedReceiptByUserAndOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetBankingTedReceiptByUserAndOperationRequest,
  GetBankingTedReceiptByUserAndOperationResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.GET_RECEIPT_BY_USER_AND_OPERATION;

/**
 * Get bankingTed receipt microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetBankingTedReceiptByUserAndOperationServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetBankingTedReceiptByUserAndOperationServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a bankingTed receipt.
   * @param payload Data.
   */
  async execute(
    payload: GetBankingTedReceiptByUserAndOperationRequest,
  ): Promise<GetBankingTedReceiptByUserAndOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetBankingTedReceiptByUserAndOperationKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bankingTed receipt message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetBankingTedReceiptByUserAndOperationResponse,
      GetBankingTedReceiptByUserAndOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankingTed receipt message.', { result });

    return result;
  }
}
