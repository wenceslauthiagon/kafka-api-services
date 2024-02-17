import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CancelStartPortabilityProcessByIdPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  CancelStartPortabilityProcessByIdPixKeyRequest,
  CancelStartPortabilityProcessByIdPixKeyResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.CANCEL_START_PORTABILITY_PROCESS_BY_ID;

/**
 * PixKey microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelStartPortabilityProcessByIdPixKeyServiceKafka {
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
      context: CancelStartPortabilityProcessByIdPixKeyServiceKafka.name,
    });
  }

  /**
   * Call pixKeys microservice to verify a pix key code.
   * @param payload Data.
   */
  async execute(
    payload: CancelStartPortabilityProcessByIdPixKeyRequest,
  ): Promise<CancelStartPortabilityProcessByIdPixKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelStartPortabilityProcessByIdPixKeyKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send pixKey message.', { data });

    // Call PixKey microservice.
    const result = await this.kafkaService.send<
      CancelStartPortabilityProcessByIdPixKeyResponse,
      CancelStartPortabilityProcessByIdPixKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixKey message.', { result });

    return result;
  }
}
