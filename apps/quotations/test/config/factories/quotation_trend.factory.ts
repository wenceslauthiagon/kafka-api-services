// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { OrderSide } from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { QuotationTrendEntity } from '@zro/quotations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';

/**
 * Quotation Trend entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, QuotationTrendEntity.name);

factory.define<QuotationTrendEntity>(
  QuotationTrendEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      ),
      quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      ),
      side: OrderSide.BUY,
      price: faker.datatype.number({ min: 1, max: 999999 }),
      amount: faker.datatype.number({ min: 1, max: 999999 }),
      gatewayName: faker.datatype.uuid(),
      timestamp: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new QuotationTrendEntity(model);
    },
  },
);

export const QuotationTrendFactory = factory;
