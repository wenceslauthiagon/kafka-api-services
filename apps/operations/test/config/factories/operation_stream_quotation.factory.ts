// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  CurrencyEntity,
  OperationStreamQuotationEntity,
} from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  provider: faker.company.name(),
  priority: faker.datatype.number({ min: 0, max: 10 }),
  price: faker.datatype.number({ min: 1, max: 9999 }),
  priceBuy: faker.datatype.number({ min: 1, max: 9999 }),
  priceSell: faker.datatype.number({ min: 1, max: 9999 }),
});

/*
 * Operation Stream Quotation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, OperationStreamQuotationEntity.name);

factory.define<OperationStreamQuotationEntity>(
  OperationStreamQuotationEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
    quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
  }),
  {
    afterBuild: (model) => {
      return new OperationStreamQuotationEntity(model);
    },
  },
);

export const OperationStreamQuotationFactory = factory;
