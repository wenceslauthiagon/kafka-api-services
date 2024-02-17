import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  ApprovePortabilityClaimProcessKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  ApprovePortabilityClaimProcessRequest,
  ApprovePortabilityClaimProcessResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.APPROVE_PORTABILITY_PROCESS;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ApprovePortabilityClaimProcessServiceKafka {
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
      context: ApprovePortabilityClaimProcessServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to approve portability process.
   * @param payload Data.
   * @returns Pix Key.
   */
  async execute(
    payload: ApprovePortabilityClaimProcessRequest,
  ): Promise<ApprovePortabilityClaimProcessResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ApprovePortabilityClaimProcessKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send approve portability claim process message.', {
      data,
    });

    // Call PixKey microservice.
    const result = await this.kafkaService.send<
      ApprovePortabilityClaimProcessResponse,
      ApprovePortabilityClaimProcessKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
