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
  GetOnboardingByUserAndStatusIsFinishedController,
  GetOnboardingByUserAndStatusIsFinishedRequest,
  GetOnboardingByUserAndStatusIsFinishedResponse,
} from '@zro/users/interface';
import {
  OnboardingDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';

export type GetOnboardingByUserAndStatusIsFinishedKafkaRequest =
  KafkaMessage<GetOnboardingByUserAndStatusIsFinishedRequest>;

export type GetOnboardingByUserAndStatusIsFinishedKafkaResponse =
  KafkaResponse<GetOnboardingByUserAndStatusIsFinishedResponse>;

/**
 * Onboarding RPC controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetOnboardingByUserAndStatusIsFinishedMicroserviceController {
  /**
   * Call get onboarding by user controller.
   *
   * @param onboardingRepository Onboarding repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.ONBOARDING.GET_BY_USER_AND_STATUS_IS_FINISHED,
  )
  async execute(
    @RepositoryParam(OnboardingDatabaseRepository)
    onboardingRepository: OnboardingRepository,
    @LoggerParam(GetOnboardingByUserAndStatusIsFinishedMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOnboardingByUserAndStatusIsFinishedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetOnboardingByUserAndStatusIsFinishedRequest(message);

    logger.info('Getting onboarding by user.', { payload });

    // Create get onboarding controller.
    const controller = new GetOnboardingByUserAndStatusIsFinishedController(
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
