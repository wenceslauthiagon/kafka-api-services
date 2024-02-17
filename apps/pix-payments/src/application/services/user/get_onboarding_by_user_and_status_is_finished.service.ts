import { Onboarding } from '@zro/users/domain';

export type GetOnboardingByUserAndStatusIsFinishedServiceRequest =
  Onboarding['user'];

export type GetOnboardingByUserAndStatusIsFinishedServiceResponse = Pick<
  Onboarding,
  | 'id'
  | 'status'
  | 'fullName'
  | 'user'
  | 'address'
  | 'branch'
  | 'occupationIncome'
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
    user: GetOnboardingByUserAndStatusIsFinishedServiceRequest,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedServiceResponse>;
}
