import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetByIdPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/nupay/infrastructure';
import {
  GetByIdPaymentRequest,
  GetByIdPaymentResponse,
} from '@zro/nupay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_BY_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetByIdPaymentNuPayServiceKafka {
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
      context: GetByIdPaymentNuPayServiceKafka.name,
    });
  }

  /**
   * Call NuPay payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: GetByIdPaymentRequest,
  ): Promise<GetByIdPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetByIdPaymentKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send NuPay Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      GetByIdPaymentResponse,
      GetByIdPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('GetByIdd Payment message.', result);

    return result;
  }
}
