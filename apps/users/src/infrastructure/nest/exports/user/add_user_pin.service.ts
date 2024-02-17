import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  AddUserPinKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import { AddUserPinRequest, AddUserPinResponse } from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER.ADD_USER_PIN;

/**
 * Service to call add user pin at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class AddUserPinServiceKafka {
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
    this.logger = logger.child({ context: AddUserPinServiceKafka.name });
  }

  /**
   * Call add user pin microservice.
   * @param request The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(request: AddUserPinRequest): Promise<AddUserPinResponse> {
    // Create request Kafka message.
    const data: AddUserPinKafkaRequest = {
      key: `${request.uuid}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Add user pin message.', { data });

    // Call add user pin microservice.
    const result = await this.kafkaService.send<
      AddUserPinResponse,
      AddUserPinKafkaRequest
    >(SERVICE, data);

    this.logger.debug('Received user message.', { result });

    return result;
  }
}
