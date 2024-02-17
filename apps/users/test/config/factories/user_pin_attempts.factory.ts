// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity, UserPinAttemptsEntity } from '@zro/users/domain';
import { UserModel, UserPinAttemptsModel } from '@zro/users/infrastructure';
import { UserFactory } from './users.factory';

/**
 * User pin attempts factory.
 */
factory.define<UserPinAttemptsModel>(
  UserPinAttemptsModel.name,
  UserPinAttemptsModel,
  () => ({
    userId: factory.assoc(UserModel.name, 'id'),
    attempts: 0,
  }),
);

/**
 * User pin attempts entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserPinAttemptsEntity.name);

factory.define<UserPinAttemptsEntity>(
  UserPinAttemptsEntity.name,
  DefaultModel,
  async () => ({
    id: faker.datatype.number({ min: 1, max: 999999 }),
    uuid: faker.datatype.uuid(),
    user: await UserFactory.create<UserEntity>(UserEntity.name),
    attempts: 0,
    updatedAt: faker.date.recent(9999),
  }),
  {
    afterBuild: (model) => {
      return new UserPinAttemptsEntity(model);
    },
  },
);

export const UserPinAttemptsFactory = factory;
