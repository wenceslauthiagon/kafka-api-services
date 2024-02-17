import { Onboarding } from '@zro/users/domain';

export type GetOnboardingByUserAndStatusIsFinishedRequest = Onboarding['user'];

export type GetOnboardingByUserAndStatusIsFinishedResponse = Pick<
  Onboarding,
  | 'id'
  | 'status'
  | 'fullName'
  | 'user'
  | 'branch'
  | 'accountNumber'
  | 'updatedAt'
>;

export interface GetOnboardingByUserAndStatusIsFinishedService {
  /**
   * Get onboarding by user.
   * @param request The user.
   * @returns Onboarding if found or null otherwise.
   */
  getOnboardingByUserAndStatusIsFinished(
    user: GetOnboardingByUserAndStatusIsFinishedRequest,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedResponse>;
}
