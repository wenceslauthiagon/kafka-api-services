import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserPinAttemptsByUserKafkaRequest,
  GetUserPinAttemptsByUserRequestDto,
  GetUserPinAttemptsByUserResponseDto,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import { GetUserPinAttemptsByUserResponse } from '@zro/users/interface';

/**
 * Service to call get by user at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER_PIN_ATTEMPTS.GET_BY_USER])
export class GetUserPinAttemptsByUserServiceKafka {
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
    this.logger = logger.child({
      context: GetUserPinAttemptsByUserServiceKafka.name,
    });
  }

  /**
   * Call get user by uuid microservice.
   * @param userId The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(userId: string): Promise<GetUserPinAttemptsByUserResponse> {
    const value: GetUserPinAttemptsByUserRequestDto = { userId };

    // Create request Kafka message.
    const data: GetUserPinAttemptsByUserKafkaRequest = {
      key: `${userId}`,
      headers: { requestId: this.requestId },
      value,
    };

    this.logger.debug('Get user pin attempts by user message.', { data });

    // Call get user by uuid microservice.
    const result = await this.kafkaService.send<
      GetUserPinAttemptsByUserResponseDto,
      GetUserPinAttemptsByUserKafkaRequest
    >(KAFKA_TOPICS.USER_PIN_ATTEMPTS.GET_BY_USER, data);

    this.logger.debug('Received user pin attempts by user message.', {
      result,
    });

    return result;
  }
}
