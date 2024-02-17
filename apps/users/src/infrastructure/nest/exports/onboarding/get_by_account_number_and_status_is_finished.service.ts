import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOnboardingByAccountNumberAndStatusIsFinishedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetOnboardingByAccountNumberAndStatusIsFinishedRequest,
  GetOnboardingByAccountNumberAndStatusIsFinishedResponse,
} from '@zro/users/interface';

const SERVICE =
  KAFKA_TOPICS.ONBOARDING.GET_BY_ACCOUNT_NUMBER_AND_STATUS_IS_FINISHED;

/**
 * Service to call get onboarding by account number at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka {
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
      context: GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka.name,
    });
  }

  /**
   * Call get finished onboarding by account number microservice.
   * @param request The user's UUID.
   * @returns Onboarding if found or null otherwise.
   */
  async execute(
    request: GetOnboardingByAccountNumberAndStatusIsFinishedRequest,
  ): Promise<GetOnboardingByAccountNumberAndStatusIsFinishedResponse> {
    // Create request Kafka message.
    const data: GetOnboardingByAccountNumberAndStatusIsFinishedKafkaRequest = {
      key: `${request.accountNumber}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get user by account number message.', { data });

    // Call get onboarding by account number microservice.
    const result = await this.kafkaService.send<
      GetOnboardingByAccountNumberAndStatusIsFinishedResponse,
      GetOnboardingByAccountNumberAndStatusIsFinishedKafkaRequest
    >(SERVICE, data);

    this.logger.debug('Received user message.', { result });

    // If no user found.
    if (!result) return null;

    return result;
  }
}
