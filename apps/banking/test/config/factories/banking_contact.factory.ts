// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common';
import { BankingContactEntity } from '@zro/banking/domain';
import { PersonDocumentType, UserEntity } from '@zro/users/domain';
import { BankingContactModel } from '@zro/banking/infrastructure';

const fakerModel = () => ({
  name: faker.name.fullName(),
  documentType: PersonDocumentType.CPF,
  document: cpf.generate(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * BankingContact factory.
 */
factory.define<BankingContactModel>(
  BankingContactModel.name,
  BankingContactModel,
  () => ({
    ...fakerModel(),
    beneficiaryUserId: faker.datatype.number({ min: 1, max: 999 }),
    userId: faker.datatype.number({ min: 1, max: 999 }),
  }),
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankingContactEntity.name);

factory.define<BankingContactEntity>(
  BankingContactEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    id: faker.datatype.number({ min: 1, max: 999 }),
    user: new UserEntity({ id: faker.datatype.number({ min: 1, max: 999 }) }),
    beneficiaryUser: new UserEntity({
      id: faker.datatype.number({ min: 1, max: 999 }),
    }),
  }),
  {
    afterBuild: (model) => {
      return new BankingContactEntity(model);
    },
  },
);

export const BankingContactFactory = factory;
