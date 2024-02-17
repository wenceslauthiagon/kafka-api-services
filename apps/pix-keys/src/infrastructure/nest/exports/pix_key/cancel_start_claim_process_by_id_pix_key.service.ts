import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CancelStartClaimProcessByIdPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  CancelStartClaimProcessByIdPixKeyRequest,
  CancelStartClaimProcessByIdPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.CANCEL_START_CLAIM_PROCESS_BY_ID;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelStartClaimProcessByIdPixKeyServiceKafka {
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
      context: CancelStartClaimProcessByIdPixKeyServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice.
   * @param payload Data.
   */
  async execute(
    payload: CancelStartClaimProcessByIdPixKeyRequest,
  ): Promise<CancelStartClaimProcessByIdPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelStartClaimProcessByIdPixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send pixKey message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      CancelStartClaimProcessByIdPixKeyResponse,
      CancelStartClaimProcessByIdPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
