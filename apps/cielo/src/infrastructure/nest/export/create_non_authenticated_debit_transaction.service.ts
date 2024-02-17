import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateNonAuthenticatedDebitTransactionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import {
  NonAuthenticatedDebitTransactionRequest,
  NonAuthenticatedDebitTransactionResponse,
} from '@zro/cielo/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_NON_AUTHENTICATED_DEBIT;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateNonAuthenticatedDebitTransactionCieloServiceKafka {
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
      context: CreateNonAuthenticatedDebitTransactionCieloServiceKafka.name,
    });
  }

  /**
   * Call Cielo payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: NonAuthenticatedDebitTransactionRequest,
  ): Promise<NonAuthenticatedDebitTransactionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateNonAuthenticatedDebitTransactionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Cielo non authenticated debit transaction message.', {
      data,
    });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      NonAuthenticatedDebitTransactionResponse,
      CreateNonAuthenticatedDebitTransactionKafkaRequest
    >(SERVICE, data);

    logger.debug('Created non authenticated debit message.', result);

    return result;
  }
}
