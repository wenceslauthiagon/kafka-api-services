// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { AdminEntity } from '@zro/admin/domain';
import { AdminModel } from '@zro/admin/infrastructure';

const saltOrRounds = 10;
const saltOrRoundsToken = 8;
const password = '1234';
const token = 'test';
const hashResetToken = bcrypt.hashSync(token, saltOrRoundsToken);
const rrClass = 'KYC';
const hash = bcrypt.hashSync(password, saltOrRounds);

/**
 * Admin factory.
 */
factory.define<AdminModel>(AdminModel.name, AdminModel, () => {
  return {
    name: faker.name.firstName(),
    email: faker.internet.email(
      faker.name.firstName(),
      faker.name.lastName() + faker.datatype.number(9999).toString(),
      'zrobank.com.br',
    ),
    active: true,
    roleId: 1,
    password: hash,
    resetToken: hashResetToken,
    rrClass,
  };
});

/**
 * Admin entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, AdminEntity.name);

factory.define<AdminEntity>(
  AdminEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.number({ min: 1, max: 999999 }),
      name: faker.name.firstName(),
      email: faker.internet.email(
        faker.name.firstName(),
        faker.name.lastName() + faker.datatype.number(9999).toString(),
        'zrobank.com.br',
      ),
      active: true,
      roleId: 1,
      password: hash,
      resetToken: hashResetToken,
      rrClass,
    };
  },
  {
    afterBuild: (model) => {
      return new AdminEntity(model);
    },
  },
);

export const AdminFactory = factory;
