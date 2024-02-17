import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  UserRepository,
  UserSettingEntity,
  UserOnboardingEntity,
  UserPinAttemptsEntity,
  UserSettingRepository,
  UserOnboardingRepository,
  UserPinAttemptsRepository,
} from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';

export class HandlePendingUserEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userPinAttemptsRepository User pin attempts repository.
   * @param userOnboardingRepository User onboarding repository.
   * @param userSettingRepository User setting repository.
   */
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly userPinAttemptsRepository: UserPinAttemptsRepository,
    private readonly userOnboardingRepository: UserOnboardingRepository,
    private readonly userSettingRepository: UserSettingRepository,
  ) {
    this.logger = logger.child({ context: HandlePendingUserEventUseCase.name });
  }

  /**
   * Handler triggered when user is pending.
   *
   * @param uuid User uuid.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {UserNotFoundException} Thrown when user was not found.
   */
  async execute(uuid: string): Promise<void> {
    // Data input check
    if (!uuid) {
      throw new MissingDataException(['Uuid']);
    }

    // Search user
    const userFound = await this.userRepository.getByUuid(uuid);

    this.logger.debug('User found.', { userFound });

    if (!userFound) {
      throw new UserNotFoundException({ uuid });
    }

    // Create user pin attemps
    const userAttempts = new UserPinAttemptsEntity({
      user: userFound,
    });

    const userPinAttempsCreated =
      await this.userPinAttemptsRepository.create(userAttempts);

    this.logger.debug('User pin attemp created.', { userPinAttempsCreated });

    // Create user onboarding
    const userOnboarding = new UserOnboardingEntity({ user: userFound });

    const userOnboardingCreated =
      await this.userOnboardingRepository.create(userOnboarding);

    this.logger.debug('User onboarding created.', { userOnboardingCreated });

    // Create user setting
    const userSetting = new UserSettingEntity({ user: userFound });

    const userSettingCreated =
      await this.userSettingRepository.create(userSetting);

    this.logger.debug('User Setting created.', { userSettingCreated });
  }
}
