// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity, UserOnboardingEntity } from '@zro/users/domain';
import { UserModel, UserOnboardingModel } from '@zro/users/infrastructure';
import { UserFactory } from './users.factory';

/**
 * User Onboarding model factory.
 */
factory.define<UserOnboardingModel>(
  UserOnboardingModel.name,
  UserOnboardingModel,
  () => {
    return {
      userId: factory.assoc(UserModel.name, 'id'),
    };
  },
);

/**
 * User Onboarding entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserOnboardingEntity.name);

factory.define<UserOnboardingEntity>(
  UserOnboardingEntity.name,
  DefaultModel,
  async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    return {
      id: faker.datatype.number({ min: 1, max: 99999 }),
      uuid: faker.datatype.uuid(),
      user,
      attempts: 0,
      updatedAt: faker.date.recent(9999),
    };
  },
  {
    afterBuild: (model) => {
      return new UserOnboardingEntity(model);
    },
  },
);

export const UserOnboardingFactory = factory;
