// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { OrderSide, ProviderEntity, SpreadEntity } from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  QuotationEntity,
  StreamPairEntity,
  StreamQuotationEntity,
  TaxEntity,
} from '@zro/quotations/domain';
import {
  QuotationModel,
  StreamPairModel,
} from '@zro/quotations/infrastructure';
import { ProviderFactory, SpreadFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import {
  StreamPairFactory,
  StreamQuotationFactory,
  TaxFactory,
} from '@zro/test/quotations/config';

const fakerModel = async () => ({
  id: faker.datatype.uuid(),
  side: OrderSide.BUY,
  price: faker.datatype.number({ min: 1, max: 9999999 }),
  priceBuy: faker.datatype.number({ min: 1, max: 9999999 }),
  priceSell: faker.datatype.number({ min: 1, max: 9999999 }),
  partialBuy: faker.datatype.number({ min: 1, max: 9999999 }),
  partialSell: faker.datatype.number({ min: 1, max: 9999999 }),
  iofAmount: faker.datatype.number({ min: 1, max: 9999999 }),
  spreadBuy: faker.datatype.number({ min: 0, max: 999 }),
  spreadSell: faker.datatype.number({ min: 0, max: 999 }),
  spreadAmountBuy: faker.datatype.number({ min: 0, max: 9999999 }),
  spreadAmountSell: faker.datatype.number({ min: 0, max: 9999999 }),
  quoteAmountBuy: faker.datatype.number({ min: 1, max: 9999999 }),
  quoteAmountSell: faker.datatype.number({ min: 1, max: 9999999 }),
  baseAmountBuy: faker.datatype.number({ min: 1, max: 9999999 }),
  baseAmountSell: faker.datatype.number({ min: 1, max: 9999999 }),
  streamQuotation: await StreamQuotationFactory.create<StreamQuotationEntity>(
    StreamQuotationEntity.name,
  ),
});

/**
 * Quotation factory.
 */
factory.define<QuotationModel>(
  QuotationModel.name,
  QuotationModel,
  async () => ({
    ...(await fakerModel()),
    spreadIds: faker.datatype.uuid(),
    providerName: faker.datatype.string(10),
    streamPairId: factory.assoc(StreamPairModel.name, 'id'),
    iofId: faker.datatype.uuid(),
    quoteCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
    baseCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
  }),
);

/**
 * Quotation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, QuotationEntity.name);

factory.define<QuotationEntity>(
  QuotationEntity.name,
  DefaultModel,
  async () => ({
    ...(await fakerModel()),
    iof: await TaxFactory.create<TaxEntity>(TaxEntity.name),
    spreads: [await SpreadFactory.create<SpreadEntity>(SpreadEntity.name)],
    provider: await ProviderFactory.create<ProviderEntity>(ProviderEntity.name),
    streamPair: await StreamPairFactory.create<StreamPairEntity>(
      StreamPairEntity.name,
    ),
    quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
    baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
  }),
  {
    afterBuild: (model) => {
      return new QuotationEntity(model);
    },
  },
);

export const QuotationFactory = factory;
