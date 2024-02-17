import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateCreditTransactionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import {
  CreditTransactionRequest,
  CreditTransactionResponse,
} from '@zro/cielo/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_CREDIT;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateCreditCieloServiceKafka {
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
      context: CreateCreditCieloServiceKafka.name,
    });
  }

  /**
   * Call Cielo payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: CreditTransactionRequest,
  ): Promise<CreditTransactionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateCreditTransactionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Cielo credit transaction message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreditTransactionResponse,
      CreateCreditTransactionKafkaRequest
    >(SERVICE, data);

    logger.debug('Created credit transaction message.', result);

    return result;
  }
}
