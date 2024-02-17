import { UserOnboarding } from '@zro/users/domain';

export interface UserOnboardingRepository {
  /**
   * Create user onboarding.
   * @param userOnboarding User onboarding object.
   * @returns User onboarding created.
   */
  create(userOnboarding: UserOnboarding): Promise<UserOnboarding>;
}
