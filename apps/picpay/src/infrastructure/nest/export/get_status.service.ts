import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPaymentStatusKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/picpay/infrastructure';
import {
  GetPaymentStatusRequest,
  GetPaymentStatusResponse,
} from '@zro/picpay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_STATUS;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPaymentStatusPicPayServiceKafka {
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
      context: GetPaymentStatusPicPayServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: GetPaymentStatusRequest,
  ): Promise<GetPaymentStatusResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPaymentStatusKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get status payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      GetPaymentStatusResponse,
      GetPaymentStatusKafkaRequest
    >(SERVICE, data);

    logger.debug('Created get status payment message.', result);

    return result;
  }
}
