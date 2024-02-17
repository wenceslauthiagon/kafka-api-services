import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
} from '@zro/common';
import {
  UserOnboardingRepository,
  UserPinAttemptsRepository,
  UserRepository,
  UserSettingRepository,
} from '@zro/users/domain';
import {
  HandlePendingUserEventController,
  HandlePendingUserEventRequest,
} from '@zro/users/interface';
import {
  UserDatabaseRepository,
  UserPinAttemptsDatabaseRepository,
  UserOnboardingDatabaseRepository,
  UserSettingDatabaseRepository,
  KAFKA_EVENTS,
} from '@zro/users/infrastructure';

export type HandlePendingUserEventKafkaRequest =
  KafkaMessage<HandlePendingUserEventRequest>;

/**
 * Pending user events observer.
 */
@Controller()
@ObserverController()
export class PendingUserNestObserver {
  /**
   * Handle pending user event.
   *
   * @param message Event Kafka message.
   * @param userRepository User repository.
   * @param userPinAttemptsRepository User pin attempts repository.
   * @param userOnboardingRepository User onboarding repository.
   * @param userSettingRepository User setting repository.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.USER.PENDING)
  async execute(
    @Payload('value') message: HandlePendingUserEventRequest,
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(UserPinAttemptsDatabaseRepository)
    userPinAttemptsRepository: UserPinAttemptsRepository,
    @RepositoryParam(UserOnboardingDatabaseRepository)
    userOnboardingRepository: UserOnboardingRepository,
    @RepositoryParam(UserSettingDatabaseRepository)
    userSettingRepository: UserSettingRepository,
    @LoggerParam(PendingUserNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingUserEventRequest(message);

    logger.info('Handle revert event payment.', { payload });

    const controller = new HandlePendingUserEventController(
      logger,
      userRepository,
      userPinAttemptsRepository,
      userOnboardingRepository,
      userSettingRepository,
    );

    try {
      // Call handle pending user event controller.
      await controller.execute(payload);

      logger.info('Pending user event handled.');
    } catch (error) {
      logger.error('Failed to handle pending user event.', error);
      // FIXME: Should notify IT team.
    }
  }
}
