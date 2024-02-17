import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  RegisterPixFraudDetectionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  RegisterPixFraudDetectionRequest,
  RegisterPixFraudDetectionResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_FRAUD_DETECTION.REGISTERED;

/**
 * Create register pix fraud detection microservice.
 */
@KafkaSubscribeService(SERVICE)
export class RegisterPixFraudDetectionServiceKafka {
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
      context: RegisterPixFraudDetectionServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to register pix fraud detection.
   * @param payload Data.
   */
  async execute(
    payload: RegisterPixFraudDetectionRequest,
  ): Promise<RegisterPixFraudDetectionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: RegisterPixFraudDetectionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send register pix fraud detection message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      RegisterPixFraudDetectionResponse,
      RegisterPixFraudDetectionKafkaRequest
    >(SERVICE, data);

    logger.debug('Received register pix fraud detection message.', { result });

    return result;
  }
}
