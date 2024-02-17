import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import { GetUserByIdRequest, GetUserByIdResponse } from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER.GET_BY_ID;

/**
 * Service to call get user by id at users microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserByIdServiceKafka {
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
    this.logger = logger.child({ context: GetUserByIdServiceKafka.name });
  }

  /**
   * Call get user by id microservice.
   *
   * @param request The user's id.
   * @returns User if found or null otherwise.
   */
  async execute(request: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    // Create request Kafka message.
    const data: GetUserByIdKafkaRequest = {
      key: `${request.id}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get user by id message.', { data });

    // Call get user by uuid microservice.
    const result = await this.kafkaService.send<
      GetUserByIdResponse,
      GetUserByIdKafkaRequest
    >(SERVICE, data);

    this.logger.debug('Received user message.', { result });

    // If no user found.
    if (!result) return null;

    return result;
  }
}
