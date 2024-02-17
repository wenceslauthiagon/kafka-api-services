// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  CurrencyEntity,
  WalletAccountEntity,
  WalletEntity,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { CryptoReportEntity, CryptoReportType } from '@zro/otc/domain';
import { CryptoReportModel } from '@zro/otc/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import {
  CurrencyFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

const typesArray = Object.values(CryptoReportType);

const fakerModel = (): Partial<CryptoReportEntity> => ({
  id: faker.datatype.uuid(),
  type: typesArray[
    faker.datatype.number({ min: 0, max: typesArray.length - 1 })
  ],
  cryptoAmount: faker.datatype.number({ min: 1000000, max: 10000000 }),
  fiatAmount: faker.datatype.number({ min: 1000000, max: 10000000 }),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Crypto Reports factory.
 */
factory.define<CryptoReportModel>(
  CryptoReportModel.name,
  CryptoReportModel,
  () => ({
    ...fakerModel(),
    userId: faker.datatype.uuid(),
    cryptoId: faker.datatype.number({ min: 1, max: 10 }),
    walletAccountId: faker.datatype.uuid(),
    walletId: faker.datatype.uuid(),
  }),
);

/**
 * Crypto Reports entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CryptoReportEntity.name);

factory.define<CryptoReportEntity>(
  CryptoReportEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    user: await UserFactory.create<UserEntity>(UserEntity.name),
    crypto: await CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name),
    wallet: await WalletFactory.create<WalletEntity>(WalletEntity.name),
    walletAccount: await WalletAccountFactory.create<WalletAccountEntity>(
      WalletAccountEntity.name,
    ),
  }),
  {
    afterBuild: (model) => {
      return new CryptoReportEntity(model);
    },
  },
);

export const CryptoReportFactory = factory;
