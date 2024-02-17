import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserByPhoneNumberResponse,
  GetUserByPhoneNumberRequest,
} from '@zro/users/interface';
import {
  GetUserByPhoneNumberKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';

/**
 * User microservice
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER.GET_BY_PHONE_NUMBER])
export class GetUserByPhoneNumberServiceKafka {
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
      context: GetUserByPhoneNumberServiceKafka.name,
    });
  }

  /**
   * Get user by phone number microservice.
   * @param request Get user by phone number data.
   * @returns User if found or null otherwise.
   */
  async execute(
    request: GetUserByPhoneNumberRequest,
  ): Promise<GetUserByPhoneNumberResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    const data: GetUserByPhoneNumberKafkaRequest = {
      key: `${request.phoneNumber}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    logger.debug('Get user by phone number message.', { data });

    const result = await this.kafkaService.send<
      GetUserByPhoneNumberResponse,
      GetUserByPhoneNumberKafkaRequest
    >(KAFKA_TOPICS.USER.GET_BY_PHONE_NUMBER, data);

    logger.debug('Received user message.', { result });

    return result;
  }
}
