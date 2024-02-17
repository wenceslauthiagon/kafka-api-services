// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { SpreadEntity } from '@zro/otc/domain';
import { UserEntity } from '@zro/users/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { SpreadModel } from '@zro/otc/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  buy: faker.datatype.number({ min: 0, max: 999 }),
  sell: faker.datatype.number({ min: 0, max: 999 }),
  amount: faker.datatype.number({ min: 1, max: 9999 }),
  createdAt: faker.date.recent(),
});

/**
 * Spread factory.
 */
factory.define<SpreadModel>(SpreadModel.name, SpreadModel, () => ({
  ...fakerModel(),
  userId: faker.datatype.uuid(),
  currencyId: faker.datatype.number({ min: 1, max: 999999 }),
  currencySymbol: faker.random.alpha({ count: 5, casing: 'upper' }),
}));

/**
 * Spread entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, SpreadEntity.name);

factory.define<SpreadEntity>(
  SpreadEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    currency: await CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name),
    user: new UserEntity({ uuid: faker.datatype.uuid() }),
  }),
  {
    afterBuild: (model) => {
      return new SpreadEntity(model);
    },
  },
);

export const SpreadFactory = factory;
