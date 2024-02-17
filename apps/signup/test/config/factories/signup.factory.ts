// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { createRandomNumberCode } from '@zro/common';
import { DefaultModel } from '@zro/common/test';
import { SignupEntity } from '@zro/signup/domain';
import { SignupModel } from '@zro/signup/infrastructure';

/**
 * Signup factory.
 */
factory.define<SignupModel>(SignupModel.name, SignupModel, () => {
  return {
    id: faker.datatype.uuid(),
    name: faker.name.firstName(),
    password: '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
    phoneNumber: '5511988776655',
    referralCode: faker.random.alphaNumeric(6),
    email: faker.internet.email(),
    confirmCode: createRandomNumberCode(5),
  };
});

/**
 * Signup entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, SignupEntity.name);

factory.define<SignupEntity>(
  SignupEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      name: faker.name.firstName(),
      password: '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
      phoneNumber: '5511988776655',
      referralCode: faker.random.alphaNumeric(6),
      email: faker.internet.email(),
      confirmCode: createRandomNumberCode(5),
    };
  },
  {
    afterBuild: (model) => {
      return new SignupEntity(model);
    },
  },
);

export const SignupFactory = factory;
