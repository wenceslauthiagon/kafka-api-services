// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  CurrencyEntity,
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import {
  CurrencyModel,
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { WalletFactory, CurrencyFactory } from '@zro/test/operations/config';

const states = Object.values(WalletAccountState);

const fakerModel = () => ({
  id: faker.datatype.number({ min: 1, max: 99999 }),
  uuid: faker.datatype.uuid(),
  state: states[Math.floor(Math.random() * states.length)],
  balance: faker.datatype.number({ min: 1, max: 99999 }),
  pendingAmount: faker.datatype.number({ min: 1, max: 99999 }),
  accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
  branchNumber: faker.datatype.number(9999).toString().padStart(4, '0'),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * WalletAccount factory.
 */
factory.define<WalletAccountModel>(
  WalletAccountModel.name,
  WalletAccountModel,
  async () => {
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
    return {
      ...fakerModel(),
      walletId: wallet.id,
      walletUUID: wallet.uuid,
      currencyId: factory.assoc(CurrencyModel.name, 'id'),
      state: WalletAccountState.ACTIVE,
    };
  },
);

/**
 * WalletAccount entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WalletAccountEntity.name);

factory.define<WalletAccountEntity>(
  WalletAccountEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    id: faker.datatype.number({ min: 1, max: 99999 }),
    wallet: await WalletFactory.create<WalletEntity>(WalletEntity.name),
    currency: await CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name),
    state: WalletAccountState.ACTIVE,
  }),
  {
    afterBuild: (model) => {
      return new WalletAccountEntity(model);
    },
  },
);

export const WalletAccountFactory = factory;
