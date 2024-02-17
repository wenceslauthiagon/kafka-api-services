// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { BankingTedEntity, BankingTedState } from '@zro/banking/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import { BankingTedModel } from '@zro/banking/infrastructure';
import { UserFactory } from '@zro/test/users/config';

const fakerModel = () => ({
  id: faker.datatype.number({ min: 1, max: 999999 }),
  transactionId: faker.datatype.uuid(),
  beneficiaryBankCode: faker.datatype
    .number({ min: 1, max: 999 })
    .toString()
    .padStart(3, '0'),
  beneficiaryBankName: faker.company.name(),
  beneficiaryName: faker.name.firstName(),
  beneficiaryType: faker.datatype.number({ min: 1, max: 9999 }).toString(),
  beneficiaryDocument: cpf.generate(),
  beneficiaryAgency: faker.datatype
    .number({ min: 1, max: 9999 })
    .toString()
    .padStart(4, '0'),
  beneficiaryAccount: faker.datatype.number({ min: 1, max: 999999 }).toString(),
  beneficiaryAccountDigit: faker.datatype
    .number({ min: 1, max: 99 })
    .toString(),
  beneficiaryAccountType: AccountType.CC,
  createdAt: new Date(),
  updatedAt: new Date(),
  amount: faker.datatype.number({ min: 1, max: 999999 }),
  state: BankingTedState.PENDING,
});

/**
 * BankingTed factory.
 */
factory.define<BankingTedModel>(BankingTedModel.name, BankingTedModel, () => ({
  ...fakerModel(),
  operationId: faker.datatype.uuid(),
  userId: faker.datatype.uuid(),
}));

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankingTedEntity.name);

factory.define<BankingTedEntity>(
  BankingTedEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    operation: new OperationEntity({ id: faker.datatype.uuid() }),
    user: UserFactory.create<UserEntity>(UserEntity.name),
  }),
  {
    afterBuild: (model) => {
      return new BankingTedEntity(model);
    },
  },
);

export const BankingTedFactory = factory;
