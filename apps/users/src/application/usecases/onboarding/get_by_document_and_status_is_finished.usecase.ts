import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Onboarding, OnboardingRepository } from '@zro/users/domain';

export class GetOnboardingByDocumentAndStatusIsFinishedUseCase {
  constructor(
    private logger: Logger,
    private readonly onboardingRepository: OnboardingRepository,
  ) {
    this.logger = logger.child({
      context: GetOnboardingByDocumentAndStatusIsFinishedUseCase.name,
    });
  }

  /**
   * Get onboarding by user.
   *
   * @param document User document.
   * @returns The onboarding found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(document: string): Promise<Onboarding> {
    if (!document) {
      throw new MissingDataException(['Document']);
    }

    // Search onboarding
    const onboarding =
      await this.onboardingRepository.getByDocumentAndStatusIsFinished(
        document,
      );

    this.logger.debug('Onboarding found.', { onboarding });

    return onboarding;
  }
}
