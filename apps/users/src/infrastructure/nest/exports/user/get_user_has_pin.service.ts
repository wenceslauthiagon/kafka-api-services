import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserHasPinKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetUserHasPinRequest,
  GetUserHasPinResponse,
} from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER.GET_USER_HAS_PIN;

/**
 * Service to call get has pin at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserHasPinServiceKafka {
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
    this.logger = logger.child({ context: GetUserHasPinServiceKafka.name });
  }

  /**
   * Call get has pin microservice.
   * @param request The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(request: GetUserHasPinRequest): Promise<GetUserHasPinResponse> {
    // Create request Kafka message.
    const data: GetUserHasPinKafkaRequest = {
      key: `${request.uuid}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get has pin message.', { data });

    // Call get has pin microservice.
    const result = await this.kafkaService.send<
      GetUserHasPinResponse,
      GetUserHasPinKafkaRequest
    >(SERVICE, data);

    this.logger.debug('Received user message.', { result });

    return result;
  }
}
