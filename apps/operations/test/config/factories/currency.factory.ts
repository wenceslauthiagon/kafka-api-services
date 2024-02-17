// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  CurrencyEntity,
  CurrencyState,
  CurrencySymbolAlign,
  CurrencyType,
} from '@zro/operations/domain';
import { CurrencyModel } from '@zro/operations/infrastructure';

const fakerModel = () => ({
  title: faker.finance.currencyName(),
  symbol: faker.random.alpha({ count: 5, casing: 'upper' }),
  symbolAlign: CurrencySymbolAlign.RIGHT,
  tag: faker.random.alpha({ count: 5, casing: 'upper' }),
  decimal: faker.datatype.number({ min: 0, max: 10 }),
  type: CurrencyType.FIAT,
  state: CurrencyState.ACTIVE,
});

/**
 * Currency factory.
 */
factory.define<CurrencyModel>(CurrencyModel.name, CurrencyModel, () =>
  fakerModel(),
);

/**
 * Currency entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CurrencyEntity.name);

factory.define<CurrencyEntity>(
  CurrencyEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    id: faker.datatype.number({ min: 1, max: 99999 }),
  }),
  {
    afterBuild: (model) => {
      return new CurrencyEntity(model);
    },
  },
);

export const CurrencyFactory = factory;
