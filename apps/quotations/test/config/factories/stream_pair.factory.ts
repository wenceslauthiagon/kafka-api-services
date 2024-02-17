// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { CurrencyEntity } from '@zro/operations/domain';
import { StreamPairEntity } from '@zro/quotations/domain';
import { StreamPairModel } from '@zro/quotations/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  priority: faker.datatype.number({ min: 0, max: 99 }),
  gatewayName: faker.random.word(),
  active: true,
});

/**
 * StreamPair factory.
 */
factory.define<StreamPairModel>(StreamPairModel.name, StreamPairModel, () => ({
  ...fakerModel(),
  quoteCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
  baseCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
}));

/**
 * StreamPair entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, StreamPairEntity.name);

factory.define<StreamPairEntity>(
  StreamPairEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
    baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    ),
  }),
  {
    afterBuild: (model) => {
      return new StreamPairEntity(model);
    },
  },
);

export const StreamPairFactory = factory;
