// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import * as bcrypt from 'bcryptjs';
import { DefaultModel } from '@zro/common/test';
import { PersonType, UserEntity, UserState } from '@zro/users/domain';
import { UserModel } from '@zro/users/infrastructure';

const saltOrRounds = 10;
const password = '1234';
const hash = bcrypt.hashSync(password, saltOrRounds);

/**
 * User model factory.
 */
factory.define<UserModel>(UserModel.name, UserModel, () => {
  return {
    name: faker.name.firstName(),
    fullName: faker.name.fullName(),
    document: cpf.generate(),
    type: PersonType.NATURAL_PERSON,
    email: faker.internet.email(
      faker.name.firstName(),
      faker.name.lastName() + faker.datatype.number(9999).toString(),
      'zrobank.com.br',
    ),
    phoneNumber:
      '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
    active: true,
    password: hash,
    pin: hash,
    inviteCode: faker.datatype
      .number({ min: 1, max: 99999 })
      .toString()
      .padStart(5, '0'),
    uuid: faker.datatype.uuid(),
    code: faker.datatype.number({ min: 1, max: 99999 }),
    pinHasCreated: true,
    confirmCode: faker.datatype.number({ min: 1, max: 99999 }),
    referralCode: faker.datatype.number({ min: 1, max: 99999 }).toString(),
    referredById: null,
    state: UserState.ACTIVE,
    props: null,
  };
});

/**
 * User entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserEntity.name);

factory.define<UserEntity>(
  UserEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.number({ min: 1, max: 999999 }),
      name: faker.name.firstName(),
      fullName: faker.name.fullName(),
      document: cpf.generate(),
      type: PersonType.NATURAL_PERSON,
      email: faker.internet.email(
        faker.name.firstName(),
        faker.name.lastName() + faker.datatype.number(9999).toString(),
        'zrobank.com.br',
      ),
      phoneNumber:
        '+551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      active: true,
      password: hash,
      pin: hash,
      uuid: faker.datatype.uuid(),
      pinHasCreated: true,
      code: faker.datatype.number({ min: 1, max: 99999 }),
      confirmCode: faker.datatype.number({ min: 1, max: 99999 }),
      referralCode: faker.datatype.number({ min: 1, max: 99999 }).toString(),
      referredBy: null,
      state: UserState.ACTIVE,
      props: null,
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new UserEntity(model);
    },
  },
);

export const UserFactory = factory;
