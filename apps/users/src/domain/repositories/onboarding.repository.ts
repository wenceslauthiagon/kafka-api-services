import { Onboarding, PersonType, User } from '@zro/users/domain';

export interface OnboardingRepository {
  create(onboarding: Onboarding): Promise<Onboarding>;
  getByUser(user: User): Promise<Onboarding[]>;
  getByUserAndStatusIsFinished(user: User): Promise<Onboarding>;
  getByAccountNumberAndStatusIsFinished(
    accountNumber: string,
  ): Promise<Onboarding>;
  getByUserAndDiscardedIsNull(user: User): Promise<Onboarding>;
  getByDocumentAndStatusIsFinished(cpf: string): Promise<Onboarding>;
  countByReferredByAndAffiliateTypeAndStatusIsFinished(
    referralUser: User,
    affiliateType: PersonType,
  ): Promise<number>;
}
