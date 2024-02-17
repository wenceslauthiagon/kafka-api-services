import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllPaymentRequest,
  GetAllPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_ALL;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPaymentServiceKafka {
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
    this.logger = logger.child({ context: GetAllPaymentServiceKafka.name });
  }

  /**
   * Call payments microservice to getAll.
   * @param payload Data.
   */
  async execute(payload: GetAllPaymentRequest): Promise<GetAllPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPaymentKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send payment message.', { data });

    // Call getAll Payment microservice.
    const result = await this.kafkaService.send<
      GetAllPaymentResponse,
      GetAllPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Received payment message.', { result });

    return result;
  }
}
