import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CancelPixFraudDetectionRegisteredKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixFraudDetectionRegisteredRequest,
  CancelPixFraudDetectionRegisteredResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_FRAUD_DETECTION.CANCELED_REGISTERED;

/**
 * Create cancel pix fraud detection registered microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelPixFraudDetectionRegisteredServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: CancelPixFraudDetectionRegisteredServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to cancel pix fraud detection registered.
   * @param payload Data.
   */
  async execute(
    payload: CancelPixFraudDetectionRegisteredRequest,
  ): Promise<CancelPixFraudDetectionRegisteredResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelPixFraudDetectionRegisteredKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send cancel pix fraud detection registered message.', {
      data,
    });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      CancelPixFraudDetectionRegisteredResponse,
      CancelPixFraudDetectionRegisteredKafkaRequest
    >(SERVICE, data);

    logger.debug('Received cancel pix fraud detection registered message.', {
      result,
    });

    return result;
  }
}
