// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { WalletAccountState } from '@zro/operations/domain';
import {
  CurrencyModel,
  WalletAccountCacheModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { WalletFactory } from '@zro/test/operations/config';

const states = Object.values(WalletAccountState);

const fakerModel = () => ({
  uuid: faker.datatype.uuid(),
  state: states[Math.floor(Math.random() * states.length)],
  balance: faker.datatype.number({ min: 1, max: 99999 }),
  pendingAmount: faker.datatype.number({ min: 1, max: 99999 }),
  accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
  branchNumber: faker.datatype.number(9999).toString().padStart(4, '0'),
});

/**
 * WalletAccountCache factory.
 */
factory.define<WalletAccountCacheModel>(
  WalletAccountCacheModel.name,
  WalletAccountCacheModel,
  async () => {
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
    return {
      ...fakerModel(),
      id: faker.datatype.number({ min: 10000, max: 99999 }),
      walletId: wallet.id,
      walletUUID: wallet.uuid,
      currencyId: factory.assoc(CurrencyModel.name, 'id'),
    };
  },
);

export const WalletAccountCacheFactory = factory;
