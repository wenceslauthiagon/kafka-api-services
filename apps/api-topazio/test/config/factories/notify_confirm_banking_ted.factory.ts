// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import {
  NotifyConfirmBankingTedEntity,
  NotifyStateType,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { NotifyConfirmBankingTedModel } from '@zro/api-topazio/infrastructure';

const fakerModel = () => ({
  transactionId: faker.datatype.uuid(),
  state: NotifyStateType.READY,
  document: cpf.generate(),
  bankCode: faker.datatype.number(999999).toString().padStart(8, '0'),
  branch: faker.datatype.number({ min: 1, max: 9999 }).toString(),
  accountNumber: faker.datatype.number({ min: 1, max: 9999 }).toString(),
  accountType: AccountType.CC,
  value: faker.datatype.number({ min: 1, max: 999999 }),
});

/**
 * NotifyConfirmBankingTed factory.
 */
factory.define<NotifyConfirmBankingTedModel>(
  NotifyConfirmBankingTedModel.name,
  NotifyConfirmBankingTedModel,
  () => {
    return fakerModel();
  },
);

/**
 * NotifyConfirmBankingTed entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyConfirmBankingTedEntity.name);

factory.define<NotifyConfirmBankingTedEntity>(
  NotifyConfirmBankingTedEntity.name,
  DefaultModel,
  async () => {
    return fakerModel();
  },
  {
    afterBuild: (model) => {
      return new NotifyConfirmBankingTedEntity(model);
    },
  },
);

export const NotifyConfirmBankingTedFactory = factory;
