// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { DefaultModel } from '@zro/common';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  OnboardingEntity,
  OnboardingStatus,
  UserEntity,
} from '@zro/users/domain';
import { OnboardingModel, UserModel } from '@zro/users/infrastructure';
import { UserFactory } from './users.factory';

const status = Object.values(OnboardingStatus);

/**
 * Onboarding factory.
 */
factory.define<OnboardingModel>(OnboardingModel.name, OnboardingModel, () => {
  return {
    userId: factory.assoc(UserModel.name, 'id'),
    status: status[Math.floor(Math.random() * status.length)],
    fullName: faker.name.fullName(),
    accountNumber: faker.datatype.number(99999999).toString().padStart(8, '0'),
    branch: faker.datatype.number(9999).toString().padStart(4, '0'),
    updatedAt: faker.date.recent(9999),
    occupationCbo: faker.datatype.number({ min: 1, max: 999999 }),
  };
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, OnboardingEntity.name);

factory.define<OnboardingEntity>(
  OnboardingEntity.name,
  DefaultModel,
  async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    return {
      id: faker.datatype.uuid(),
      user,
      status: status[Math.floor(Math.random() * status.length)],
      fullName: faker.name.fullName(),
      accountNumber: faker.datatype
        .number(99999999)
        .toString()
        .padStart(8, '0'),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      updatedAt: faker.date.recent(9999),
      occupationCbo: faker.datatype.number({ min: 1, max: 999999 }),
    };
  },
  {
    afterBuild: (model) => {
      return new OnboardingEntity(model);
    },
  },
);

export const OnboardingFactory = factory;
