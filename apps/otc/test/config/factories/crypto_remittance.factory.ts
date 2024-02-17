// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  OrderType,
  OrderSide,
  CryptoRemittanceStatus,
  CryptoRemittanceEntity,
  CryptoMarketEntity,
} from '@zro/otc/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CryptoRemittanceModel } from '@zro/otc/infrastructure';
import { CryptoMarketFactory } from './conversion_market.factory';

const sides = Object.values(OrderSide);

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  amount: faker.datatype.number({ min: 1, max: 99999 }),
  type: OrderType.MARKET,
  side: sides[faker.datatype.number({ min: 0, max: sides.length - 1 })],
  createdAt: faker.date.recent(),
  status: CryptoRemittanceStatus.PENDING,
});

/**
 * Crypto Remittance factory.
 */
factory.define<CryptoRemittanceModel>(
  CryptoRemittanceModel.name,
  CryptoRemittanceModel,
  async () => ({
    ...fakerModel(),
    quoteCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
    baseCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
    marketName: faker.random.word(),
    priceSignificantDigits: faker.datatype.number({ min: 1, max: 8 }),
  }),
);

/**
 * Crypto Remittance Entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CryptoRemittanceEntity.name);

factory.define<CryptoRemittanceEntity>(
  CryptoRemittanceEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
    baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
    market: await CryptoMarketFactory.create<CryptoMarketEntity>(
      CryptoMarketEntity.name,
    ),
  }),
  {
    afterBuild: (model) => {
      return new CryptoRemittanceEntity(model);
    },
  },
);

export const CryptoRemittanceFactory = factory;
