import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserByUuidKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetUserByUuidRequest,
  GetUserByUuidResponse,
} from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER.GET_BY_UUID;

/**
 * Service to call get user by uuid at users microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserByUuidServiceKafka {
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
    this.logger = logger.child({ context: GetUserByUuidServiceKafka.name });
  }

  /**
   * Call get user by uuid microservice.
   *
   * @param request The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(request: GetUserByUuidRequest): Promise<GetUserByUuidResponse> {
    // Create request Kafka message.
    const data: GetUserByUuidKafkaRequest = {
      key: `${request.uuid}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get user by uuid message.', { data });

    // Call get user by uuid microservice.
    const result = await this.kafkaService.send<
      GetUserByUuidResponse,
      GetUserByUuidKafkaRequest
    >(SERVICE, data);

    this.logger.debug('Received user message.', { result });

    // If no user found.
    if (!result) return null;

    return result;
  }
}
