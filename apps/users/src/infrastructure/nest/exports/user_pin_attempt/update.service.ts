import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateUserPinAttemptsKafkaRequest,
  UpdateUserPinAttemptsRequestDto,
  UpdateUserPinAttemptsResponseDto,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import { UpdateUserPinAttemptsResponse } from '@zro/users/interface';

/**
 * Service to call get by user at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER_PIN_ATTEMPTS.UPDATE])
export class UpdateUserPinAttemptsServiceKafka {
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
      context: UpdateUserPinAttemptsServiceKafka.name,
    });
  }

  /**
   * Call update microservice.
   * @param userId The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(
    userId: string,
    attempts = 0,
  ): Promise<UpdateUserPinAttemptsResponse> {
    const value: UpdateUserPinAttemptsRequestDto = { userId, attempts };

    // Create request Kafka message.
    const data: UpdateUserPinAttemptsKafkaRequest = {
      key: `${userId}`,
      headers: { requestId: this.requestId },
      value,
    };

    this.logger.debug('Update user pin attempts message.', { data });

    // Call get user by uuid microservice.
    const result = await this.kafkaService.send<
      UpdateUserPinAttemptsResponseDto,
      UpdateUserPinAttemptsKafkaRequest
    >(KAFKA_TOPICS.USER_PIN_ATTEMPTS.UPDATE, data);

    this.logger.debug('Received updated user pin attempts message.', {
      result,
    });

    return result;
  }
}
