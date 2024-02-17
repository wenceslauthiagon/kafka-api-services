// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity, UserApiKeyEntity } from '@zro/users/domain';
import { UserApiKeyModel, UserModel } from '@zro/users/infrastructure';
import { UserFactory } from './users.factory';

const saltOrRounds = 10;
const password = '1234';
const hash = bcrypt.hashSync(password, saltOrRounds);

/**
 * User api key factory.
 */
factory.define<UserApiKeyModel>(UserApiKeyModel.name, UserApiKeyModel, () => {
  return {
    id: faker.datatype.uuid(),
    userId: factory.assoc(UserModel.name, 'uuid'),
    hash,
    createdAt: faker.date.recent(9999),
    updatedAt: faker.date.recent(9999),
  };
});

/**
 * User api key entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserApiKeyEntity.name);

factory.define<UserApiKeyEntity>(
  UserApiKeyEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      user: await UserFactory.create<UserEntity>(UserEntity.name),
      hash,
      createdAt: faker.date.recent(9999),
      updatedAt: faker.date.recent(9999),
    };
  },
  {
    afterBuild: (model) => {
      return new UserApiKeyEntity(model);
    },
  },
);

export const UserApiKeyFactory = factory;
