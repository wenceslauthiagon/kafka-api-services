import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CancelingOwnershipClaimProcessKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  CancelingOwnershipClaimProcessRequest,
  CancelingOwnershipClaimProcessResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.CANCELING_OWNERSHIP_PROCESS;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelingOwnershipClaimProcessServiceKafka {
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
      context: CancelingOwnershipClaimProcessServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to cancel ownership process.
   * @param payload Data.
   * @returns Pix Key.
   */
  async execute(
    payload: CancelingOwnershipClaimProcessRequest,
  ): Promise<CancelingOwnershipClaimProcessResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelingOwnershipClaimProcessKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send canceling ownership claim process message.', { data });

    // Call PixKey microservice.
    const result = await this.kafkaService.send<
      CancelingOwnershipClaimProcessResponse,
      CancelingOwnershipClaimProcessKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
