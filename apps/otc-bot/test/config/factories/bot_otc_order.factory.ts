// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  BotOtcEntity,
  BotOtcOrderEntity,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import {
  CryptoMarketEntity,
  CryptoOrderEntity,
  CryptoRemittanceStatus,
  OrderType,
  ProviderEntity,
} from '@zro/otc/domain';
import { CurrencyEntity, CurrencyType } from '@zro/operations/domain';
import { BotOtcOrderModel } from '@zro/otc-bot/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';
import {
  CryptoMarketFactory,
  CryptoOrderFactory,
  ProviderFactory,
} from '@zro/test/otc/config';
import { BotOtcFactory } from './bot_otc.factory';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  state: BotOtcOrderState.FILLED,
  amount: faker.datatype.number({ min: 10000, max: 9999999 }),
  type: OrderType.MARKET,
  sellStatus: CryptoRemittanceStatus.FILLED,
  sellPrice: faker.datatype.number({ min: 10000, max: 9999999 }),
  sellProviderOrderId: faker.datatype.uuid(),
  sellProviderName: 'PROVIDER-SELL',
  sellExecutedPrice: faker.datatype.number({ min: 10000, max: 9999999 }),
  sellExecutedAmount: faker.datatype.number({ min: 10000, max: 9999999 }),
  sellFee: faker.datatype.number({ min: 1, max: 999 }),
  buyProviderOrderId: faker.datatype.uuid(),
  buyProviderName: 'PROVIDER-BUY',
  buyExecutedPrice: faker.datatype.number({ min: 10000, max: 9999999 }),
  buyExecutedAmount: faker.datatype.number({ min: 10000, max: 9999999 }),
  buyFee: faker.datatype.number({ min: 10000, max: 9999999 }),
  createdAt: faker.date.recent(),
});

/**
 * BotOtcOrder model factory.
 */
factory.define<BotOtcOrderModel>(
  BotOtcOrderModel.name,
  BotOtcOrderModel,
  async () => ({
    ...fakerModel(),
    baseCurrencyId: faker.datatype.number({ min: 1, max: 9 }),
    baseCurrencySymbol: faker.lorem.word(),
    baseCurrencyDecimal: faker.datatype.number({ min: 2, max: 8 }),
    baseCurrencyType: CurrencyType.CRYPTO,
    quoteCurrencyId: faker.datatype.number({ min: 1, max: 9 }),
    quoteCurrencySymbol: faker.lorem.word(),
    quoteCurrencyDecimal: faker.datatype.number({ min: 2, max: 8 }),
    quoteCurrencyType: CurrencyType.FIAT,
    sellPriceSignificantDigits: faker.datatype.number({ min: 1, max: 8 }),
    marketName: faker.datatype.uuid(),
    market: await CryptoMarketFactory.create<CryptoMarketEntity>(
      CryptoMarketEntity.name,
    ),
    sellProviderId: faker.datatype.uuid(),
    buyProviderId: faker.datatype.uuid(),
    sellOrderId: faker.datatype.uuid(),
    buyOrderId: faker.datatype.uuid(),
    botOtcId: faker.datatype.uuid(),
  }),
);

/**
 * BotOtcOrder entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BotOtcOrderEntity.name);

factory.define<BotOtcOrderEntity>(
  BotOtcOrderEntity.name,
  DefaultModel,
  async () => {
    const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );
    const quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );
    const market = await CryptoMarketFactory.create<CryptoMarketEntity>(
      CryptoMarketEntity.name,
    );
    const sellProvider = await ProviderFactory.create<ProviderEntity>(
      ProviderEntity.name,
    );
    const buyProvider = await ProviderFactory.create<ProviderEntity>(
      ProviderEntity.name,
    );
    const sellOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
      CryptoOrderEntity.name,
    );
    const buyOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
      CryptoOrderEntity.name,
    );
    const botOtc = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

    return {
      ...fakerModel(),
      baseCurrency,
      quoteCurrency,
      market,
      sellProvider,
      buyProvider,
      sellOrder,
      buyOrder,
      botOtc,
    };
  },
  {
    afterBuild: (model) => {
      return new BotOtcOrderEntity(model);
    },
  },
);

export const BotOtcOrderFactory = factory;
