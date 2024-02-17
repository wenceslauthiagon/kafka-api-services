import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Onboarding, User, OnboardingRepository } from '@zro/users/domain';

export class GetOnboardingByUserAndStatusIsFinishedUseCase {
  constructor(
    private logger: Logger,
    private readonly onboardingRepository: OnboardingRepository,
  ) {
    this.logger = logger.child({
      context: GetOnboardingByUserAndStatusIsFinishedUseCase.name,
    });
  }

  /**
   * Get onboarding by user.
   *
   * @param user User.
   * @returns The onboarding found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User): Promise<Onboarding> {
    if (!user?.uuid) {
      throw new MissingDataException(['User']);
    }

    // Search onboarding
    const onboarding =
      await this.onboardingRepository.getByUserAndStatusIsFinished(user);

    this.logger.debug('Onboarding found.', { onboarding });

    return onboarding;
  }
}
