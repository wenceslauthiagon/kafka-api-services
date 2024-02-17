import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CancelPortabilityRequestClaimProcessKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  CancelPortabilityRequestClaimProcessRequest,
  CancelPortabilityRequestClaimProcessResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.CANCEL_PORTABILITY_REQUEST_PROCESS;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelPortabilityClaimProcessServiceKafka {
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
      context: CancelPortabilityClaimProcessServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to cancel portability process.
   * @param payload Data.
   * @returns Pix Key.
   */
  async execute(
    payload: CancelPortabilityRequestClaimProcessRequest,
  ): Promise<CancelPortabilityRequestClaimProcessResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelPortabilityRequestClaimProcessKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send cancel portability claim process message.', { data });

    // Call PixKey microservice.
    const result = await this.kafkaService.send<
      CancelPortabilityRequestClaimProcessResponse,
      CancelPortabilityRequestClaimProcessKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
