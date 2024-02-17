import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/nupay/infrastructure';
import { GetAllPaymentResponse } from '@zro/nupay/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_ALL;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPaymentNuPayServiceKafka {
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
      context: GetAllPaymentNuPayServiceKafka.name,
    });
  }

  /**
   * Call NuPay payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(): Promise<GetAllPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPaymentKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: null,
    };

    logger.debug('Send NuPay Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      GetAllPaymentResponse,
      GetAllPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('GetAlld Payment message.', result);

    return result;
  }
}
