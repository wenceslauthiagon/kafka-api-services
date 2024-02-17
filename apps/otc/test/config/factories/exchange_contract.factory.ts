// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { ExchangeContractEntity } from '@zro/otc/domain';
import { ExchangeContractModel } from '@zro/otc/infrastructure';

/**
 * Exchange Contract factory.
 */
factory.define<ExchangeContractModel>(
  ExchangeContractModel.name,
  ExchangeContractModel,
  () => {
    return {
      contractNumber: faker.random.word(),
      vetQuote: faker.datatype.number({ min: 1, max: 99999 }),
      contractQuote: faker.datatype.number({ min: 1, max: 99999 }),
      totalAmount: faker.datatype.number({ min: 1, max: 99999 }),
    };
  },
);

/**
 * Exchange Contract entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ExchangeContractEntity.name);

factory.define<ExchangeContractEntity>(
  ExchangeContractEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      contractNumber: faker.random.word(),
      vetQuote: faker.datatype.number({ min: 1, max: 99999 }),
      contractQuote: faker.datatype.number({ min: 1, max: 99999 }),
      totalAmount: faker.datatype.number({ min: 1, max: 99999 }),
    };
  },
  {
    afterBuild: (model) => {
      return new ExchangeContractEntity(model);
    },
  },
);

export const ExchangeContractFactory = factory;
