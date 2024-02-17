// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  LimitTypePeriodStart,
  UserLimitEntity,
  UserLimitTrackerEntity,
} from '@zro/operations/domain';
import { UserLimitTrackerModel } from '@zro/operations/infrastructure';
import { UserLimitFactory } from './user_limit.factory';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  usedDailyLimit: faker.datatype.number({ min: 0, max: 99999 }),
  usedMonthlyLimit: faker.datatype.number({ min: 0, max: 99999 }),
  usedAnnualLimit: faker.datatype.number({ min: 0, max: 99999 }),
  usedNightlyLimit: faker.datatype.number({ min: 0, max: 99999 }),
  periodStart: LimitTypePeriodStart.DATE,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * UserLimitTracker factory.
 */
factory.define<UserLimitTrackerModel>(
  UserLimitTrackerModel.name,
  UserLimitTrackerModel,
  () => ({
    ...fakerModel(),
    userLimitId: faker.datatype.uuid(),
  }),
);

/**
 * UserLimitTracker entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserLimitTrackerEntity.name);

factory.define<UserLimitTrackerEntity>(
  UserLimitTrackerEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    userLimit: await UserLimitFactory.create<UserLimitEntity>(
      UserLimitEntity.name,
    ),
  }),
  {
    afterBuild: (model) => {
      return new UserLimitTrackerEntity(model);
    },
  },
);

export const UserLimitTrackerFactory = factory;
