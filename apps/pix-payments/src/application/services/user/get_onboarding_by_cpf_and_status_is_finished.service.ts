import { Onboarding } from '@zro/users/domain';

export type GetOnboardingByDocumentAndStatusIsFinishedServiceRequest = Pick<
  Onboarding,
  'document'
>;

export type GetOnboardingByDocumentAndStatusIsFinishedServiceResponse = Pick<
  Onboarding,
  'id' | 'status' | 'fullName' | 'user'
>;

export interface GetOnboardingByDocumentAndStatusIsFinishedService {
  /**
   * Get onboarding by user document;
   * @returns Onboarding if found or null otherwise.
   */
  getOnboardingByCpfAndStatusIsFinished(
    request: GetOnboardingByDocumentAndStatusIsFinishedServiceRequest,
  ): Promise<GetOnboardingByDocumentAndStatusIsFinishedServiceResponse>;
}
