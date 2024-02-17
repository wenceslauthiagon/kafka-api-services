import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  ApprovePortabilityClaimStartProcessKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  ApprovePortabilityClaimStartProcessRequest,
  ApprovePortabilityClaimStartProcessResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.START_PORTABILITY_PROCESS;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ApprovePortabilityClaimStartProcessServiceKafka {
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
      context: ApprovePortabilityClaimStartProcessServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to start portability process.
   * @param payload Data.
   * @returns Pix Key.
   */
  async execute(
    payload: ApprovePortabilityClaimStartProcessRequest,
  ): Promise<ApprovePortabilityClaimStartProcessResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ApprovePortabilityClaimStartProcessKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send approve portability claim start process message.', {
      data,
    });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      ApprovePortabilityClaimStartProcessResponse,
      ApprovePortabilityClaimStartProcessKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
