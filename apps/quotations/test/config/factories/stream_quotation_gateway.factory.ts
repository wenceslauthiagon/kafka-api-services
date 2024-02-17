// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { CurrencyEntity } from '@zro/operations/domain';
import { ProviderEntity } from '@zro/otc/domain';
import { StreamQuotationGatewayEntity } from '@zro/quotations/domain';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  base: new CurrencyEntity({ symbol: 'USD' }),
  buy: faker.datatype.float(2),
  sell: faker.datatype.float(2),
  amount: faker.datatype.float(4),
  provider: new ProviderEntity({ name: faker.company.name() }),
  timestamp: new Date(),
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, StreamQuotationGatewayEntity.name);

/**
 * Stream Quotation Gateway entity factory.
 */
factory.define<StreamQuotationGatewayEntity>(
  StreamQuotationGatewayEntity.name,
  DefaultModel,
  () => fakerModel(),
  {
    afterBuild: (model) => {
      return new StreamQuotationGatewayEntity(model);
    },
  },
);

export const StreamQuotationGatewayFactory = factory;
