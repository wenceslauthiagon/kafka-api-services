import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ReceivePaymentChargebackKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePaymentChargebackRequest,
  ReceivePaymentChargebackResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.RECEIVE_CHARGEBACK;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ReceivePaymentChargebackServiceKafka {
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
      context: ReceivePaymentChargebackServiceKafka.name,
    });
  }

  /**
   * Call Payment microservice to create a PaymentChargeback.
   * @param payload Data.
   */
  async execute(
    payload: ReceivePaymentChargebackRequest,
  ): Promise<ReceivePaymentChargebackResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ReceivePaymentChargebackKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Payment chargeback message.', { data });

    // Call create Payment microservice.
    const result = await this.kafkaService.send<
      ReceivePaymentChargebackResponse,
      ReceivePaymentChargebackKafkaRequest
    >(SERVICE, data);

    logger.debug('Received Payment chargeback message.', { result });

    return result;
  }
}
