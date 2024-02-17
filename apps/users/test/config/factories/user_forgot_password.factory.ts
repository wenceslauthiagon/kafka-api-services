// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  UserEntity,
  UserForgotPasswordEntity,
  UserForgotPasswordState,
} from '@zro/users/domain';
import { UserModel, UserForgotPasswordModel } from '@zro/users/infrastructure';
import { UserFactory } from './users.factory';
import { createRandomNumberCode } from '@zro/common';

const fakerModel = () => {
  const states = Object.values(UserForgotPasswordState);
  const state = states[Math.floor(Math.random() * states.length)];
  const phoneNumber =
    '+551198' + faker.datatype.number(9999999).toString().padStart(7, '0');
  const email = faker.internet.email();
  const code = createRandomNumberCode(5);

  return {
    id: faker.datatype.uuid(),
    state,
    phoneNumber,
    email,
    code,
    attempts: 0,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
};

/**
 * User forgot model factory.
 */
factory.define<UserForgotPasswordModel>(
  UserForgotPasswordModel.name,
  UserForgotPasswordModel,
  () => ({
    userId: factory.assoc(UserModel.name, 'uuid'),
    ...fakerModel(),
  }),
);

/**
 * User forgot password entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserForgotPasswordEntity.name);

factory.define<UserForgotPasswordEntity>(
  UserForgotPasswordEntity.name,
  DefaultModel,
  async () => ({
    user: await UserFactory.create<UserEntity>(UserEntity.name),
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new UserForgotPasswordEntity(model);
    },
  },
);

export const UserForgotPasswordFactory = factory;
