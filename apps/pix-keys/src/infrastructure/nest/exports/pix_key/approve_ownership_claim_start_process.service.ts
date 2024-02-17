import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  ApproveOwnershipClaimStartProcessKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  ApproveOwnershipClaimStartProcessRequest,
  ApproveOwnershipClaimStartProcessResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.START_OWNERSHIP_PROCESS;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ApproveOwnershipClaimStartProcessServiceKafka {
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
      context: ApproveOwnershipClaimStartProcessServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to start ownership process.
   * @param payload Data.
   * @returns Pix Key.
   */
  async execute(
    payload: ApproveOwnershipClaimStartProcessRequest,
  ): Promise<ApproveOwnershipClaimStartProcessResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ApproveOwnershipClaimStartProcessKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send approve ownership claim start process message.', {
      data,
    });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      ApproveOwnershipClaimStartProcessResponse,
      ApproveOwnershipClaimStartProcessKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
