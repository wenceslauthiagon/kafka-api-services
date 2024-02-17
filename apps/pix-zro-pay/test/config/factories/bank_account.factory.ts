// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { DefaultModel } from '@zro/common/test';
import { BankAccountModel } from '@zro/pix-zro-pay/infrastructure';
import { BankAccountEntity, BankAccountName } from '@zro/pix-zro-pay/domain';

const fakerModel = () => ({
  id: faker.datatype.number(),
  agency: faker.datatype.string(),
  accountNumber: faker.datatype.string(),
  cpfCnpj: faker.datatype.string(),
  pixKeyType: faker.datatype.string(),
  pixKey: faker.datatype.string(),
  name: BankAccountName.BANK_ZRO_BANK,
  slug: faker.datatype.string(),
  refundCpf: true,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * BankAccount model factory.
 */
factory.define<BankAccountModel>(
  BankAccountModel.name,
  BankAccountModel,
  () => {
    return fakerModel();
  },
);

/**
 * BankAccount entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankAccountEntity.name);

factory.define<BankAccountEntity>(
  BankAccountEntity.name,
  DefaultModel,
  async () => {
    return fakerModel();
  },
  {
    afterBuild: (model) => {
      return new BankAccountEntity(model);
    },
  },
);

export const BankAccountFactory = factory;
