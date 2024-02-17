// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { cnpj } from 'cpf-cnpj-validator';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { AdminEntity } from '@zro/admin/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { AdminBankingAccountEntity } from '@zro/banking/domain';
import { AdminBankingAccountModel } from '@zro/banking/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  document: cnpj.generate(),
  fullName: faker.name.firstName(),
  branchNumber: faker.datatype.number(9999).toString().padStart(4, '0'),
  accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
  accountDigit: faker.datatype.number({ min: 1, max: 99 }).toString(),
  accountType: AccountType.CC,
  bankName: faker.company.name(),
  bankCode: faker.datatype.number(999999).toString().padStart(8, '0'),
  description: faker.datatype.string(10),
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * BankingTed factory.
 */
factory.define<AdminBankingAccountModel>(
  AdminBankingAccountModel.name,
  AdminBankingAccountModel,
  () => ({
    ...fakerModel(),
    createdBy: faker.datatype.number({ min: 1, max: 99 }),
    updatedBy: faker.datatype.number({ min: 1, max: 99 }),
  }),
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, AdminBankingAccountEntity.name);

factory.define<AdminBankingAccountEntity>(
  AdminBankingAccountEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    createdByAdmin: new AdminEntity({
      id: faker.datatype.number({ min: 1, max: 99 }),
    }),
    updatedByAdmin: new AdminEntity({
      id: faker.datatype.number({ min: 1, max: 99 }),
    }),
  }),
  {
    afterBuild: (model) => {
      return new AdminBankingAccountEntity(model);
    },
  },
);

export const AdminBankingAccountFactory = factory;
