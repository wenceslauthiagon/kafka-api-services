// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  ExchangeQuotationEntity,
  ExchangeQuotationState,
} from '@zro/otc/domain';
import { ExchangeQuotationModel } from '@zro/otc/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  quotationPspId: faker.datatype.number({ min: 1, max: 99999 }).toString(),
  solicitationPspId: faker.datatype.uuid(),
  quotation: faker.datatype.number({ min: 1, max: 99999 }),
  gatewayName: faker.datatype.number({ min: 1, max: 99999 }).toString(),
  amount: faker.datatype.number({ min: 1, max: 99999 }),
  amountExternalCurrency: faker.datatype.number({ min: 1, max: 99999 }),
  state: ExchangeQuotationState.PENDING,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Exchange Quotation factory.
 */
factory.define<ExchangeQuotationModel>(
  ExchangeQuotationModel.name,
  ExchangeQuotationModel,
  () => {
    return fakerModel();
  },
);

/**
 * Exchange Quotation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ExchangeQuotationEntity.name);

factory.define<ExchangeQuotationEntity>(
  ExchangeQuotationEntity.name,
  DefaultModel,
  async () => {
    return fakerModel();
  },
  {
    afterBuild: (model) => {
      return new ExchangeQuotationEntity(model);
    },
  },
);

export const ExchangeQuotationFactory = factory;
