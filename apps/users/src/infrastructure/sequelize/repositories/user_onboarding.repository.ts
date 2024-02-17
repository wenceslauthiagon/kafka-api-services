import { DatabaseRepository } from '@zro/common';
import { UserOnboarding, UserOnboardingRepository } from '@zro/users/domain';
import { UserOnboardingModel } from '@zro/users/infrastructure';

export class UserOnboardingDatabaseRepository
  extends DatabaseRepository
  implements UserOnboardingRepository
{
  static toDomain(userOnboardingModel: UserOnboardingModel): UserOnboarding {
    return userOnboardingModel?.toDomain() ?? null;
  }

  async create(userOnboarding: UserOnboarding): Promise<UserOnboarding> {
    const createdUserOnboarding =
      await UserOnboardingModel.create<UserOnboardingModel>(userOnboarding, {
        transaction: this.transaction,
      });

    userOnboarding.id = createdUserOnboarding.id;

    return userOnboarding;
  }
}
