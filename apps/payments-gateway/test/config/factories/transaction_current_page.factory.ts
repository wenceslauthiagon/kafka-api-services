// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { DefaultModel } from '@zro/common/test';
import { TransactionCurrentPageEntity } from '@zro/payments-gateway/domain';
import { getMoment } from '@zro/common';

/**
 * Transaction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, TransactionCurrentPageEntity.name);

factory.define<TransactionCurrentPageEntity>(
  TransactionCurrentPageEntity.name,
  DefaultModel,
  () => {
    return {
      createdDate: getMoment().format('YYYY-MM-DD'),
      actualPage: 1,
    };
  },
  {
    afterBuild: (model) => {
      return new TransactionCurrentPageEntity(model);
    },
  },
);

export const TransactionCurrentPageFactory = factory;
