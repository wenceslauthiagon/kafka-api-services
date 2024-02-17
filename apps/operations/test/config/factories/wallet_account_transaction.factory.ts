// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  OperationEntity,
  WalletAccountEntity,
  WalletAccountTransactionEntity,
  WalletAccountTransactionState,
  WalletAccountTransactionType,
} from '@zro/operations/domain';
import {
  OperationModel,
  WalletAccountModel,
  WalletAccountTransactionModel,
} from '@zro/operations/infrastructure';
import {
  WalletAccountFactory,
  OperationFactory,
} from '@zro/test/operations/config';

const states = Object.values(WalletAccountTransactionState);
const transactionTypes = Object.values(WalletAccountTransactionType);

const fakerModel = () => {
  const transactionType =
    transactionTypes[Math.floor(Math.random() * transactionTypes.length)];

  const value = faker.datatype.number({ min: 1, max: 9999 });

  const previousBalance = faker.datatype.number({ min: 1, max: 99999 });
  const updatedBalance =
    previousBalance +
    value * (transactionType === WalletAccountTransactionType.CREDIT ? 1 : -1);

  return {
    transactionType,
    value,
    updatedBalance,
    previousBalance,
    state: states[Math.floor(Math.random() * states.length)],
  };
};

/**
 * WalletAccountTransaction factory.
 */
factory.define<WalletAccountTransactionModel>(
  WalletAccountTransactionModel.name,
  WalletAccountTransactionModel,
  () => ({
    walletAccountId: factory.assoc(WalletAccountModel.name, 'id'),
    operationId: factory.assoc(OperationModel.name, 'id'),
    ...fakerModel(),
  }),
);

/**
 * WalletAccountTransaction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WalletAccountTransactionEntity.name);

factory.define<WalletAccountTransactionEntity>(
  WalletAccountTransactionEntity.name,
  DefaultModel,
  async () => ({
    operation: await OperationFactory.create<OperationEntity>(
      OperationEntity.name,
    ),
    walletAccount: await WalletAccountFactory.create<WalletAccountEntity>(
      WalletAccountEntity.name,
    ),
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new WalletAccountTransactionEntity(model);
    },
  },
);

export const WalletAccountTransactionFactory = factory;
