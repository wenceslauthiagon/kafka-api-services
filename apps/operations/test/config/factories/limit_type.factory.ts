// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  LimitTypePeriodStart,
  LimitTypeCheck,
  LimitTypeEntity,
  CurrencyEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';
import { CurrencyModel, LimitTypeModel } from '@zro/operations/infrastructure';
import {
  CurrencyFactory,
  TransactionTypeFactory,
} from '@zro/test/operations/config';

const checks = Object.values(LimitTypeCheck);
const periods = Object.values(LimitTypePeriodStart);

const fakerModel = () => ({
  id: faker.datatype.number({ min: 1, max: 999 }),
  tag: faker.random.alpha({ count: 5, casing: 'upper' }),
  description: faker.random.alpha({ count: 10, casing: 'upper' }),
  periodStart: periods[Math.floor(Math.random() * periods.length)],
  check: checks[Math.floor(Math.random() * checks.length)],
});

/**
 * LimitType factory.
 */
factory.define<LimitTypeModel>(LimitTypeModel.name, LimitTypeModel, () => ({
  ...fakerModel(),
  currencyId: factory.assoc(CurrencyModel.name, 'id'),
}));

/**
 * LimitType entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, LimitTypeEntity.name);

factory.define<LimitTypeEntity>(
  LimitTypeEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    currency: await CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name),
    transactionTypes: [
      await TransactionTypeFactory.create<TransactionTypeEntity>(
        TransactionTypeEntity.name,
      ),
    ],
  }),
  {
    afterBuild: (model) => {
      return new LimitTypeEntity(model);
    },
  },
);

export const LimitTypeFactory = factory;
