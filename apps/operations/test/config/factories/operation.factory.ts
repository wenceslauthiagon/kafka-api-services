// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  CurrencyEntity,
  OperationEntity,
  OperationState,
  TransactionTypeEntity,
  WalletAccountEntity,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CurrencyModel,
  OperationModel,
  TransactionTypeModel,
  WalletAccountModel,
} from '@zro/operations/infrastructure';
import {
  CurrencyFactory,
  TransactionTypeFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

const states = Object.values(OperationState);

const fakerModel = () => {
  const rawValue = faker.datatype.number({ min: 1, max: 99999 });
  const fee = faker.datatype.number({ min: 1, max: 99999 });
  const value = rawValue + fee;

  return {
    id: faker.datatype.uuid(),
    emitterId: 0,
    receiverId: 0,
    value,
    rawValue,
    fee,
    description: faker.lorem.words(2),
    state: states[Math.floor(Math.random() * states.length)],
  };
};

/**
 * Operation model factory.
 */
factory.define<OperationModel>(OperationModel.name, OperationModel, () => ({
  ...fakerModel(),
  ownerId: faker.datatype.number({ min: 1, max: 99999 }),
  beneficiaryId: faker.datatype.number({ min: 1, max: 99999 }),
  ownerWalletAccountId: factory.assoc(WalletAccountModel.name, 'id'),
  beneficiaryWalletAccountId: factory.assoc(WalletAccountModel.name, 'id'),
  transactionTypeId: factory.assoc(TransactionTypeModel.name, 'id'),
  currencyId: factory.assoc(CurrencyModel.name, 'id'),
}));

/**
 * Operation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, OperationEntity.name);

factory.define<OperationEntity>(
  OperationEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    owner: await UserFactory.create<UserEntity>(UserEntity.name),
    beneficiary: await UserFactory.create<UserEntity>(UserEntity.name),
    ownerWalletAccount: await WalletAccountFactory.create<WalletAccountEntity>(
      WalletAccountEntity.name,
    ),
    beneficiaryWalletAccount:
      await WalletAccountFactory.create<WalletAccountEntity>(
        WalletAccountEntity.name,
      ),
    transactionType: await TransactionTypeFactory.create<TransactionTypeEntity>(
      TransactionTypeEntity.name,
    ),
    currency: await CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name),
  }),
  {
    afterBuild: (model) => {
      return new OperationEntity(model);
    },
  },
);

export const OperationFactory = factory;
