import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CancelingPortabilityClaimProcessKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  CancelingPortabilityClaimProcessRequest,
  CancelingPortabilityClaimProcessResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.CANCELING_PORTABILITY_PROCESS;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelingPortabilityClaimProcessServiceKafka {
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
      context: CancelingPortabilityClaimProcessServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to cancel portability process.
   * @param payload Data.
   * @returns Pix Key.
   */
  async execute(
    payload: CancelingPortabilityClaimProcessRequest,
  ): Promise<CancelingPortabilityClaimProcessResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelingPortabilityClaimProcessKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send canceling portability claim process message.', { data });

    // Call PixKey microservice.
    const result = await this.kafkaService.send<
      CancelingPortabilityClaimProcessResponse,
      CancelingPortabilityClaimProcessKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
