import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOnboardingByUserAndStatusIsFinishedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetOnboardingByUserAndStatusIsFinishedRequest,
  GetOnboardingByUserAndStatusIsFinishedResponse,
} from '@zro/users/interface';

/**
 * Service to call get onboarding by user at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([
  KAFKA_TOPICS.ONBOARDING.GET_BY_USER_AND_STATUS_IS_FINISHED,
])
export class GetOnboardingByUserAndStatusIsFinishedServiceKafka {
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
      context: GetOnboardingByUserAndStatusIsFinishedServiceKafka.name,
    });
  }

  /**
   * Call get finished onboarding by user id microservice.
   * @param request The user's UUID.
   * @returns Onboarding if found or null otherwise.
   */
  async execute(
    request: GetOnboardingByUserAndStatusIsFinishedRequest,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedResponse> {
    // Create request Kafka message.
    const data: GetOnboardingByUserAndStatusIsFinishedKafkaRequest = {
      key: `${request.userId}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get user by status message.', { data });

    // Call get user by cpf microservice.
    const result = await this.kafkaService.send<
      GetOnboardingByUserAndStatusIsFinishedResponse,
      GetOnboardingByUserAndStatusIsFinishedKafkaRequest
    >(KAFKA_TOPICS.ONBOARDING.GET_BY_USER_AND_STATUS_IS_FINISHED, data);

    this.logger.debug('Received user message.', { result });

    // If no user found.
    if (!result) return null;

    return result;
  }
}
