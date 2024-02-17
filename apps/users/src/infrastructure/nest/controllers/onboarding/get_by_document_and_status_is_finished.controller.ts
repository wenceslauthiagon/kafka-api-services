import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { OnboardingRepository } from '@zro/users/domain';
import {
  GetOnboardingByDocumentAndStatusIsFinishedController,
  GetOnboardingByDocumentAndStatusIsFinishedRequest,
  GetOnboardingByDocumentAndStatusIsFinishedResponse,
} from '@zro/users/interface';
import {
  OnboardingDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';

export type GetOnboardingByDocumentAndStatusIsFinishedKafkaRequest =
  KafkaMessage<GetOnboardingByDocumentAndStatusIsFinishedRequest>;

export type GetOnboardingByDocumentAndStatusIsFinishedKafkaResponse =
  KafkaResponse<GetOnboardingByDocumentAndStatusIsFinishedResponse>;

/**
 * Onboarding RPC controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController {
  /**
   * Call get onboarding by document controller.
   *
   * @param onboardingRepository Onboarding repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.ONBOARDING.GET_BY_DOCUMENT_AND_STATUS_IS_FINISHED,
  )
  async execute(
    @RepositoryParam(OnboardingDatabaseRepository)
    onboardingRepository: OnboardingRepository,
    @LoggerParam(
      GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController,
    )
    logger: Logger,
    @Payload('value')
    message: GetOnboardingByDocumentAndStatusIsFinishedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOnboardingByDocumentAndStatusIsFinishedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetOnboardingByDocumentAndStatusIsFinishedRequest(
      message,
    );

    logger.info('Getting onboarding by document.', { payload });

    // Create get onboarding controller.
    const controller = new GetOnboardingByDocumentAndStatusIsFinishedController(
      logger,
      onboardingRepository,
    );

    // Get onboarding.
    const onboarding = await controller.execute(payload);

    logger.info('Onboarding found.', { onboarding });

    return {
      ctx,
      value: onboarding,
    };
  }
}
