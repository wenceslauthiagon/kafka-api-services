import { DatabaseRepository } from '@zro/common';
import {
  Onboarding,
  OnboardingStatus,
  OnboardingRepository,
  User,
  PersonType,
} from '@zro/users/domain';
import { OnboardingModel, UserModel } from '@zro/users/infrastructure';

export class OnboardingDatabaseRepository
  extends DatabaseRepository
  implements OnboardingRepository
{
  static toDomain(onboardingModel: OnboardingModel): Onboarding {
    return onboardingModel?.toDomain() ?? null;
  }

  async create(onboarding: Onboarding): Promise<Onboarding> {
    const createdOnboarding = await OnboardingModel.create<OnboardingModel>(
      onboarding,
      { transaction: this.transaction },
    );

    onboarding.id = createdOnboarding.id;
    onboarding.status = createdOnboarding.status;
    onboarding.createdAt = createdOnboarding.createdAt;
    onboarding.updatedAt = createdOnboarding.updatedAt;

    return onboarding;
  }

  async getByUser(user: User): Promise<Onboarding[]> {
    return OnboardingModel.findAll({
      where: { userId: user.id },
      transaction: this.transaction,
    }).then((data) => data.map(OnboardingDatabaseRepository.toDomain));
  }

  async getByUserAndStatusIsFinished(user: User): Promise<Onboarding> {
    return OnboardingModel.findOne({
      include: {
        model: UserModel,
        attributes: ['uuid'],
        where: { uuid: user.uuid },
      },
      where: { status: OnboardingStatus.FINISHED },
      transaction: this.transaction,
    }).then(OnboardingDatabaseRepository.toDomain);
  }

  async getByAccountNumberAndStatusIsFinished(
    accountNumber: string,
  ): Promise<Onboarding> {
    return OnboardingModel.findOne({
      include: {
        model: UserModel,
        attributes: ['uuid'],
      },
      where: { accountNumber, status: OnboardingStatus.FINISHED },
      transaction: this.transaction,
    }).then(OnboardingDatabaseRepository.toDomain);
  }

  async getByUserAndDiscardedIsNull(user: User): Promise<Onboarding> {
    return OnboardingModel.findOne({
      where: {
        userId: user.id,
        discardedAt: null,
      },
      transaction: this.transaction,
    }).then(OnboardingDatabaseRepository.toDomain);
  }

  async getByDocumentAndStatusIsFinished(cpf: string): Promise<Onboarding> {
    return OnboardingModel.findOne({
      include: { model: UserModel, attributes: ['uuid'] },
      where: { document: cpf, status: OnboardingStatus.FINISHED },
      transaction: this.transaction,
    }).then(OnboardingDatabaseRepository.toDomain);
  }

  async countByReferredByAndAffiliateTypeAndStatusIsFinished(
    referralBy: User,
    affiliateType: PersonType,
  ): Promise<number> {
    return OnboardingModel.count<OnboardingModel>({
      include: {
        model: UserModel,
        attributes: [],
        where: { referredById: referralBy.id, type: affiliateType },
      },
      where: { status: OnboardingStatus.FINISHED },
      transaction: this.transaction,
    });
  }
}
