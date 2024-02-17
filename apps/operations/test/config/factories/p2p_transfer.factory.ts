// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  CurrencyEntity,
  OperationEntity,
  P2PTransferEntity,
  WalletEntity,
} from '@zro/operations/domain';
import {
  CurrencyModel,
  OperationModel,
  P2PTransferModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import {
  CurrencyFactory,
  OperationFactory,
  WalletFactory,
} from '@zro/test/operations/config';

const fakerModel = () => ({
  amount: faker.datatype.number({ min: 1, max: 99999 }),
  fee: faker.datatype.number({ min: 0, max: 99 }),
});

/**
 * P2PTransfer factory.
 */
factory.define<P2PTransferModel>(
  P2PTransferModel.name,
  P2PTransferModel,
  () => ({
    userId: faker.datatype.uuid(),
    walletId: factory.assoc(WalletModel.name, 'uuid'),
    beneficiaryWalletId: factory.assoc(WalletModel.name, 'uuid'),
    currencyId: factory.assoc(CurrencyModel.name, 'id'),
    currencySymbol: faker.datatype.uuid(),
    operationId: factory.assoc(OperationModel.name, 'id'),
    ...fakerModel(),
  }),
);

/**
 * P2PTransfer entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, P2PTransferEntity.name);

factory.define<P2PTransferEntity>(
  P2PTransferEntity.name,
  DefaultModel,
  async () => ({
    id: faker.datatype.uuid(),
    user: await UserFactory.create<UserEntity>(UserEntity.name),
    wallet: await WalletFactory.create<WalletEntity>(WalletEntity.name),
    beneficiaryWallet: await WalletFactory.create<WalletEntity>(
      WalletEntity.name,
    ),
    currency: await CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name),
    operation: await OperationFactory.create<OperationEntity>(
      OperationEntity.name,
    ),
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new P2PTransferEntity(model);
    },
  },
);

export const P2PTransferFactory = factory;
