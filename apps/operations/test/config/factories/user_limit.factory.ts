// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { LimitTypeEntity, UserLimitEntity } from '@zro/operations/domain';
import { LimitTypeModel, UserLimitModel } from '@zro/operations/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import { LimitTypeFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  dailyLimit: faker.datatype.number({ min: 1, max: 99999 }),
  monthlyLimit: faker.datatype.number({ min: 1, max: 99999 }),
  yearlyLimit: faker.datatype.number({ min: 1, max: 99999 }),
  nighttimeStart: '20:00',
  nighttimeEnd: '06:00',
});

/**
 * UserLimit factory.
 */
factory.define<UserLimitModel>(UserLimitModel.name, UserLimitModel, () => ({
  limitTypeId: factory.assoc(LimitTypeModel.name, 'id'),
  userId: faker.datatype.number({ min: 1, max: 99999 }),
  ...fakerModel(),
}));

/**
 * UserLimit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserLimitEntity.name);

factory.define<UserLimitEntity>(
  UserLimitEntity.name,
  DefaultModel,
  async () => ({
    id: faker.datatype.uuid(),
    limitType: await LimitTypeFactory.create<LimitTypeEntity>(
      LimitTypeEntity.name,
    ),
    user: await UserFactory.create<UserEntity>(UserEntity.name),
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new UserLimitEntity(model);
    },
  },
);

export const UserLimitFactory = factory;
