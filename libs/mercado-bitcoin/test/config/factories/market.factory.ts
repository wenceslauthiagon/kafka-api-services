// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import {
  MercadoBitcoinSymbol,
  MercadoBitcoinSymbolEntity,
  MercadoBitcoinSymbolType,
} from '@zro/mercado-bitcoin/domain';
import { DefaultModel, formatValueFromIntToFloat } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';

const fakerModel = (
  baseCurrency: Currency,
  quoteCurrency: Currency,
): MercadoBitcoinSymbol => ({
  id: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
  symbol: `${baseCurrency.symbol}-${quoteCurrency.symbol}`,
  description: baseCurrency.title,
  currency: quoteCurrency.symbol,
  baseCurrency: baseCurrency.symbol,
  exchangeListed: true,
  exchangeTraded: true,
  minmovement: Number(
    formatValueFromIntToFloat(1, baseCurrency.decimal),
  ).toFixed(),
  pricescale: 10 ** Math.floor(quoteCurrency.decimal / 2),
  type: MercadoBitcoinSymbolType.CRYPTO,
  timezone: 'America/Recife',
  sessionRegular: '24x7',
  withdrawalFee: Number(
    formatValueFromIntToFloat(1, baseCurrency.decimal),
  ).toFixed(),
});

/**
 * Mercado Bitcoin entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, MercadoBitcoinSymbolEntity.name);

factory.define<MercadoBitcoinSymbolEntity>(
  MercadoBitcoinSymbolEntity.name,
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
      return new MercadoBitcoinSymbolEntity(model);
    },
  },
);

export const MercadoBitcoinSymbolFactory = factory;
