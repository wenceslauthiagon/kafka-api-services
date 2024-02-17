// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity, UserSettingEntity } from '@zro/users/domain';
import { UserModel, UserSettingModel } from '@zro/users/infrastructure';
import { UserFactory } from './users.factory';

/**
 * User setting model factory.
 */
factory.define<UserSettingModel>(
  UserSettingModel.name,
  UserSettingModel,
  () => ({
    userId: factory.assoc(UserModel.name, 'id'),
  }),
);

/**
 * User setting entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserSettingEntity.name);

factory.define<UserSettingEntity>(
  UserSettingEntity.name,
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
      return new UserSettingEntity(model);
    },
  },
);

export const UserSettingFactory = factory;
