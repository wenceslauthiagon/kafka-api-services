// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { CurrencyEntity } from '@zro/operations/domain';
import { RemittanceExposureRuleEntity } from '@zro/otc/domain';
import { RemittanceExposureRuleModel } from '@zro/otc/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  amount: faker.datatype.number({ min: 1, max: 999999 }),
  seconds: faker.datatype.number({ min: 1, max: 999999 }),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * RemittanceExposureRule factory.
 */
factory.define<RemittanceExposureRuleModel>(
  RemittanceExposureRuleModel.name,
  RemittanceExposureRuleModel,
  () => {
    return {
      ...fakerModel(),
      currencyId: faker.datatype.number({ min: 1, max: 999999 }),
      currencySymbol: faker.datatype.uuid(),
    };
  },
);

/**
 * RemittanceExposureRule entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, RemittanceExposureRuleEntity.name);

factory.define<RemittanceExposureRuleEntity>(
  RemittanceExposureRuleEntity.name,
  DefaultModel,
  async () => {
    const currency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );

    return Object.assign({}, fakerModel(), {
      currency,
    });
  },
  {
    afterBuild: (model) => {
      return new RemittanceExposureRuleEntity(model);
    },
  },
);

export const RemittanceExposureRuleFactory = factory;
