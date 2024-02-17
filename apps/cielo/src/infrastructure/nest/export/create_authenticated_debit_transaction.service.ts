import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateAuthenticatedDebitransactionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import {
  AuthenticatedDebitTransactionRequest,
  AuthenticatedDebitTransactionResponse,
} from '@zro/cielo/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_AUTHENTICATED_DEBIT;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateAuthenticatedDebitCieloServiceKafka {
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
      context: CreateAuthenticatedDebitCieloServiceKafka.name,
    });
  }

  /**
   * Call Cielo authenticated debit microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: AuthenticatedDebitTransactionRequest,
  ): Promise<AuthenticatedDebitTransactionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateAuthenticatedDebitransactionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Cielo 3DS authenticated transaction message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      AuthenticatedDebitTransactionResponse,
      CreateAuthenticatedDebitransactionKafkaRequest
    >(SERVICE, data);

    logger.debug('Created 3DS authenticated transaction message.', result);

    return result;
  }
}
