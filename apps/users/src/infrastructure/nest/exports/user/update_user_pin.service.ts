import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateUserPinKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  UpdateUserPinRequest,
  UpdateUserPinResponse,
} from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER.UPDATE_USER_PIN;

/**
 * Service to call update user pin at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateUserPinServiceKafka {
  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: UpdateUserPinServiceKafka.name });
  }

  /**
   * Call update user pin microservice.
   * @param request The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(request: UpdateUserPinRequest): Promise<UpdateUserPinResponse> {
    // Create request Kafka message.
    const data: UpdateUserPinKafkaRequest = {
      key: `${request.uuid}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Update user pin message.', { data });

    // Call update user pin microservice.
    const result = await this.kafkaService.send<
      UpdateUserPinResponse,
      UpdateUserPinKafkaRequest
    >(SERVICE, data);

    this.logger.debug('Received user message.', { result });

    return result;
  }
}
