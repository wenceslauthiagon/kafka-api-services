import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateSignupKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/signup/infrastructure';
import {
  CreateSignupRequest,
  CreateSignupResponse,
} from '@zro/signup/interface';

/**
 * Service to call create signup at signup microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.SIGNUP.CREATE])
export class CreateSignupServiceKafka {
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
      context: CreateSignupServiceKafka.name,
    });
  }

  /**
   * Call signup microservice to create a new signup.
   * @param payload Data.
   */
  async execute(payload: CreateSignupRequest): Promise<CreateSignupResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateSignupKafkaRequest = {
      key: `${payload.phoneNumber}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send signup message.', { data });

    // Call signup microservice.
    const result = await this.kafkaService.send<
      CreateSignupResponse,
      CreateSignupKafkaRequest
    >(KAFKA_TOPICS.SIGNUP.CREATE, data);

    logger.debug('Received signup message.', { result });

    return result;
  }
}
