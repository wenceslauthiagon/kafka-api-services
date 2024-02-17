// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { DefaultModel, formatValueFromIntToFloat } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { B2C2Market, B2C2MarketEntity, B2C2MarketType } from '@zro/b2c2/domain';

const fakerModel = (
  baseCurrency: Currency,
  quoteCurrency: Currency,
): B2C2Market => ({
  name: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
  underlier: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
  quoteCurrency: quoteCurrency.symbol,
  baseCurrency: baseCurrency.symbol,
  type: B2C2MarketType.SPOT,
  isTradable: true,
  quantityPrecision: Number(formatValueFromIntToFloat(1, baseCurrency.decimal)),
  maxQuantityPerTrade: 100,
  minQuantityPerTrade: Number(
    formatValueFromIntToFloat(1, baseCurrency.decimal),
  ),
  priceSignificantDigits: quoteCurrency.decimal,
});

/**
 * B2C2 market entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, B2C2MarketEntity.name);

factory.define<B2C2MarketEntity>(
  B2C2MarketEntity.name,
  DefaultModel,
  async (options) => {
    const baseCurrency =
      options.baseCurrency ??
      (await CurrencyFactory.create<Currency>(CurrencyEntity.name));
    const quoteCurrency =
      options.quoteCurrency ??
      (await CurrencyFactory.create<Currency>(CurrencyEntity.name));

    return fakerModel(baseCurrency, quoteCurrency);
  },
  {
    afterBuild: (model) => {
      return new B2C2MarketEntity(model);
    },
  },
);

export const B2C2MarketFactory = factory;
