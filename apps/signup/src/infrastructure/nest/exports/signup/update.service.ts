import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateSignupKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/signup/infrastructure';
import {
  UpdateSignupRequest,
  UpdateSignupResponse,
} from '@zro/signup/interface';

const SERVICE = KAFKA_TOPICS.SIGNUP.UPDATE;

/**
 * Service to call update signup at signup microservice.
 *
 * This class must be updated for each request.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateSignupServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UpdateSignupServiceKafka.name,
    });
  }

  /**
   * Call signup microservice to update a new signup.
   * @param payload Data.
   */
  async execute(payload: UpdateSignupRequest): Promise<UpdateSignupResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateSignupKafkaRequest = {
      key: `${payload.phoneNumber}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send signup update message.', { data });

    // Call signup microservice.
    const result = await this.kafkaService.send<
      UpdateSignupResponse,
      UpdateSignupKafkaRequest
    >(SERVICE, data);

    logger.debug('Received signup update response.', { result });

    return result;
  }
}
