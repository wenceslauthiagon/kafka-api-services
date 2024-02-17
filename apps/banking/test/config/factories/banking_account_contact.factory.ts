// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  BankingAccountContactEntity,
  BankingContactEntity,
} from '@zro/banking/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  BankingAccountContactModel,
  BankingContactModel,
} from '@zro/banking/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.number({ min: 1, max: 99999 }),
  branchNumber: faker.datatype.number(9999).toString().padStart(4, '0'),
  accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
  accountDigit: faker.datatype.number({ min: 1, max: 99 }).toString(),
  bankName: faker.company.name(),
  bankCode: faker.datatype.number(999999).toString().padStart(8, '0'),
  accountType: AccountType.CC,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * BankingAccountContact factory.
 */
factory.define<BankingAccountContactModel>(
  BankingAccountContactModel.name,
  BankingAccountContactModel,
  () => ({
    ...fakerModel(),
    bankingContactId: factory.assoc(BankingContactModel.name, 'id'),
  }),
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankingAccountContactEntity.name);

factory.define<BankingAccountContactEntity>(
  BankingAccountContactEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    bankingContact: new BankingContactEntity({
      id: faker.datatype.number({ min: 1, max: 99999 }),
    }),
  }),
  {
    afterBuild: (model) => {
      return new BankingAccountContactEntity(model);
    },
  },
);

export const BankingAccountContactFactory = factory;
