import { Onboarding } from '@zro/users/domain';

export type GetOnboardingByAccountNumberAndStatusIsFinishedServiceResponse =
  Pick<Onboarding, 'id' | 'user' | 'status'>;

export interface GetOnboardingByAccountNumberAndStatusIsFinishedService {
  /**
   * Get onboarding by accountNumber.
   * @param request The accountNumber.
   * @returns Onboarding if found or null otherwise.
   */
  getOnboardingByAccountNumberAndStatusIsFinished(
    accountNumber: Onboarding['accountNumber'],
  ): Promise<GetOnboardingByAccountNumberAndStatusIsFinishedServiceResponse>;
}
