// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { CryptoMarketEntity, OrderSide } from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  name: faker.random.word(),
  conversionType: OrderSide.BUY,
  providerName: faker.random.word(),
  active: true,
  requireValidUntil: false,
  requireStopPrice: false,
  minSize: null,
  maxSize: null,
  sizeIncrement: null,
  priceIncrement: null,
  priceSignificantDigits: null,
});

/**
 * Conversion market entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CryptoMarketEntity.name);

factory.define<CryptoMarketEntity>(
  CryptoMarketEntity.name,
  DefaultModel,
  async () => {
    const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );
    const quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );

    return Object.assign({}, fakerModel(), {
      baseCurrency,
      quoteCurrency,
    });
  },
  {
    afterBuild: (model) => {
      return new CryptoMarketEntity(model);
    },
  },
);

export const CryptoMarketFactory = factory;
