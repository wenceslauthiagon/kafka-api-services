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
  GetOnboardingByAccountNumberAndStatusIsFinishedRequest,
  GetOnboardingByAccountNumberAndStatusIsFinishedController,
  GetOnboardingByAccountNumberAndStatusIsFinishedResponse,
} from '@zro/users/interface';
import {
  OnboardingDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';

export type GetOnboardingByAccountNumberAndStatusIsFinishedKafkaRequest =
  KafkaMessage<GetOnboardingByAccountNumberAndStatusIsFinishedRequest>;

export type GetOnboardingByAccountNumberAndStatusIsFinishedKafkaResponse =
  KafkaResponse<GetOnboardingByAccountNumberAndStatusIsFinishedResponse>;

/**
 * Onboarding RPC controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController {
  /**
   * Call get onboarding by account number controller.
   *
   * @param onboardingRepository Onboarding repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.ONBOARDING.GET_BY_ACCOUNT_NUMBER_AND_STATUS_IS_FINISHED,
  )
  async execute(
    @RepositoryParam(OnboardingDatabaseRepository)
    onboardingRepository: OnboardingRepository,
    @LoggerParam(
      GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController,
    )
    logger: Logger,
    @Payload('value')
    message: GetOnboardingByAccountNumberAndStatusIsFinishedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOnboardingByAccountNumberAndStatusIsFinishedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetOnboardingByAccountNumberAndStatusIsFinishedRequest(
      message,
    );

    logger.info('Getting onboarding by user.', { payload });

    // Create get onboarding controller.
    const controller =
      new GetOnboardingByAccountNumberAndStatusIsFinishedController(
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
