// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf, cnpj } from 'cpf-cnpj-validator';

import { DefaultModel } from '@zro/common/test';
import { PersonType, UserEntity } from '@zro/users/domain';
import {
  DecodedPixAccountEntity,
  DecodedPixAccountState,
  AccountType,
} from '@zro/pix-payments/domain';
import { BankEntity } from '@zro/banking/domain';
import { UserFactory } from '@zro/test/users/config';
import { BankFactory } from '@zro/test/banking/config';
import { DecodedPixAccountModel } from '@zro/pix-payments/infrastructure';

const randDocument = () => {
  return Math.random() < 0.5
    ? { doc: cpf.generate(), type: PersonType.NATURAL_PERSON }
    : { doc: cnpj.generate(), type: PersonType.LEGAL_PERSON };
};

/**
 * DecodedPixAccount model factory.
 */
factory.define<DecodedPixAccountModel>(
  DecodedPixAccountModel.name,
  DecodedPixAccountModel,
  () => {
    const randPerson = randDocument();
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      props: null,
      name: faker.name.fullName(),
      tradeName: faker.company.name(),
      state: DecodedPixAccountState.PENDING,
      personType: randPerson.type,
      bankIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      bankName: faker.company.name(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountType: AccountType.CACC,
      document: randPerson.doc,
    };
  },
);

/**
 * PixDecodedAccount entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, DecodedPixAccountEntity.name);

factory.define<DecodedPixAccountEntity>(
  DecodedPixAccountEntity.name,
  DefaultModel,
  async () => {
    const randPerson = randDocument();
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const bank = await BankFactory.create<BankEntity>(BankEntity.name);

    return {
      id: faker.datatype.uuid(),
      user,
      props: null,
      name: faker.name.fullName(),
      tradeName: faker.company.name(),
      state: DecodedPixAccountState.PENDING,
      personType: randPerson.type,
      bank,
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountType: AccountType.CACC,
      document: randPerson.doc,
    };
  },
  {
    afterBuild: (model) => {
      return new DecodedPixAccountEntity(model);
    },
  },
);

export const DecodedPixAccountFactory = factory;
