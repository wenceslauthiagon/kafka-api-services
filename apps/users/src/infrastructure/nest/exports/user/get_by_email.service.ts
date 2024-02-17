import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserByEmailResponse,
  GetUserByEmailRequest,
} from '@zro/users/interface';
import {
  GetUserByEmailKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';

/**
 * User microservice
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER.GET_BY_EMAIL])
export class GetUserByEmailServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetUserByEmailServiceKafka.name,
    });
  }

  /**
   * Get user by email microservice.
   * @param request Get user by email data.
   * @returns User if found or null otherwise.
   */
  async execute(
    request: GetUserByEmailRequest,
  ): Promise<GetUserByEmailResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    const data: GetUserByEmailKafkaRequest = {
      key: `${request.email}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    logger.debug('Get user by email message.', { data });

    const result = await this.kafkaService.send<
      GetUserByEmailResponse,
      GetUserByEmailKafkaRequest
    >(KAFKA_TOPICS.USER.GET_BY_EMAIL, data);

    logger.debug('Received user message.', { result });

    return result;
  }
}
