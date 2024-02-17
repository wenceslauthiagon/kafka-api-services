// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  OperationEntity,
  PendingWalletAccountTransactionEntity,
  WalletAccountEntity,
} from '@zro/operations/domain';

/*
 * Pending Wallet Account Transaction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PendingWalletAccountTransactionEntity.name);

factory.define<PendingWalletAccountTransactionEntity>(
  PendingWalletAccountTransactionEntity.name,
  DefaultModel,
  async () => {
    return {
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
      walletAccount: new WalletAccountEntity({
        id: faker.datatype.number({ min: 1, max: 9999 }),
      }),
      value: faker.datatype.number({ min: 1, max: 9999 }),
    };
  },
  {
    afterBuild: (model) => {
      return new PendingWalletAccountTransactionEntity(model);
    },
  },
);

export const PendingWalletAccountTransactionFactory = factory;
