// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  StreamPairEntity,
  StreamQuotationEntity,
} from '@zro/quotations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { StreamPairFactory } from './stream_pair.factory';

/**
 * Stream Quotation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, StreamQuotationEntity.name);

factory.define<StreamQuotationEntity>(
  StreamQuotationEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      ),
      quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      ),
      buy: faker.datatype.number({ min: 1, max: 999999 }),
      sell: faker.datatype.number({ min: 1, max: 999999 }),
      amount: faker.datatype.number({ min: 1, max: 999999 }),
      gatewayName: faker.datatype.uuid(),
      timestamp: faker.date.recent(),
      streamPair: await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      ),
      composedBy: [
        new StreamQuotationEntity({
          id: faker.datatype.uuid(),
          baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
            CurrencyEntity.name,
          ),
          quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
            CurrencyEntity.name,
          ),
          buy: faker.datatype.number({ min: 1, max: 999999 }),
          sell: faker.datatype.number({ min: 1, max: 999999 }),
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          gatewayName: faker.datatype.uuid(),
          timestamp: faker.date.recent(),
          streamPair: await StreamPairFactory.create<StreamPairEntity>(
            StreamPairEntity.name,
          ),
        }),
        new StreamQuotationEntity({
          id: faker.datatype.uuid(),
          baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
            CurrencyEntity.name,
          ),
          quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
            CurrencyEntity.name,
          ),
          buy: faker.datatype.number({ min: 1, max: 999999 }),
          sell: faker.datatype.number({ min: 1, max: 999999 }),
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          gatewayName: faker.datatype.uuid(),
          timestamp: faker.date.recent(),
          streamPair: await StreamPairFactory.create<StreamPairEntity>(
            StreamPairEntity.name,
          ),
        }),
      ],
    };
  },
  {
    afterBuild: (model) => {
      return new StreamQuotationEntity(model);
    },
  },
);

export const StreamQuotationFactory = factory;
