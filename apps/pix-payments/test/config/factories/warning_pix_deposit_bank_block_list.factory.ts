// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cnpj } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { WarningPixDepositBankBlockListEntity } from '@zro/pix-payments/domain';
import { WarningPixDepositBankBlockListModel } from '@zro/pix-payments/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  cnpj: cnpj.generate(),
  name: faker.company.name(),
  description: faker.datatype.string(),
});

/**
 * WarningPixDepositBankBlockList factory.
 */
factory.define<WarningPixDepositBankBlockListModel>(
  WarningPixDepositBankBlockListModel.name,
  WarningPixDepositBankBlockListModel,
  () => {
    return {
      ...fakerModel(),
    };
  },
);

/**
 * WarningPixDepositBankBlockList entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WarningPixDepositBankBlockListEntity.name);

factory.define<WarningPixDepositBankBlockListEntity>(
  WarningPixDepositBankBlockListEntity.name,
  DefaultModel,
  async () => {
    return {
      ...fakerModel(),
    };
  },
  {
    afterBuild: (model) => {
      return new WarningPixDepositBankBlockListEntity(model);
    },
  },
);

export const WarningPixDepositBankBlockListFactory = factory;
