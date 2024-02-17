// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { CashbackEntity, ConversionEntity } from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { CashbackModel } from '@zro/otc/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { ConversionFactory } from '@zro/test/otc/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  amount: faker.datatype.number({ min: 1, max: 99999 }),
  description: faker.datatype.string(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Cashback model factory.
 */
factory.define<CashbackModel>(CashbackModel.name, CashbackModel, () => ({
  ...fakerModel(),
  currencyId: faker.datatype.number({ min: 1, max: 999999 }),
  conversionId: faker.datatype.uuid(),
  userId: faker.datatype.uuid(),
}));

/**
 * Cashback entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CashbackEntity.name);

factory.define<CashbackEntity>(
  CashbackEntity.name,
  DefaultModel,
  async () => {
    const currency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );
    const conversion = await ConversionFactory.create<ConversionEntity>(
      ConversionEntity.name,
    );
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    return Object.assign({}, fakerModel(), { currency, conversion, user });
  },
  {
    afterBuild: (model) => {
      return new CashbackEntity(model);
    },
  },
);

export const CashbackFactory = factory;
