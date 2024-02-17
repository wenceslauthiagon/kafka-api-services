import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOnboardingByDocumentAndStatusIsFinishedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetOnboardingByDocumentAndStatusIsFinishedRequest,
  GetOnboardingByDocumentAndStatusIsFinishedResponse,
} from '@zro/users/interface';

/**
 * Service to call get user by document at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([
  KAFKA_TOPICS.ONBOARDING.GET_BY_DOCUMENT_AND_STATUS_IS_FINISHED,
])
export class GetOnboardingByDocumentAndStatusIsFinishedServiceKafka {
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
      context: GetOnboardingByDocumentAndStatusIsFinishedServiceKafka.name,
    });
  }

  /**
   * Call get finished onboarding by document microservice.
   * @param request The user's UUID.
   * @returns Onboarding if found or null otherwise.
   */
  async execute(
    request: GetOnboardingByDocumentAndStatusIsFinishedRequest,
  ): Promise<GetOnboardingByDocumentAndStatusIsFinishedResponse> {
    // Create request Kafka message.
    const data: GetOnboardingByDocumentAndStatusIsFinishedKafkaRequest = {
      key: `${request.document}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get onboarding by document message.', { data });

    // Call get user by document microservice.
    const result = await this.kafkaService.send<
      GetOnboardingByDocumentAndStatusIsFinishedResponse,
      GetOnboardingByDocumentAndStatusIsFinishedKafkaRequest
    >(KAFKA_TOPICS.ONBOARDING.GET_BY_DOCUMENT_AND_STATUS_IS_FINISHED, data);

    this.logger.debug('Received onboarding message.', { result });

    // If no user found.
    if (!result) return null;

    return result;
  }
}
