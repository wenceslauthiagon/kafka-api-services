import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Onboarding, OnboardingRepository } from '@zro/users/domain';

export class GetOnboardingByAccountNumberAndStatusIsFinishedUseCase {
  constructor(
    private logger: Logger,
    private readonly onboardingRepository: OnboardingRepository,
  ) {
    this.logger = logger.child({
      context: GetOnboardingByAccountNumberAndStatusIsFinishedUseCase.name,
    });
  }

  /**
   * Get onboarding by account number.
   *
   * @param accountNumber string.
   * @returns The onboarding found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(accountNumber: string): Promise<Onboarding> {
    if (!accountNumber) {
      throw new MissingDataException(['Document']);
    }

    // Search onboarding
    const onboarding =
      await this.onboardingRepository.getByAccountNumberAndStatusIsFinished(
        accountNumber,
      );

    this.logger.debug('Onboarding found.', { onboarding });

    return onboarding;
  }
}
