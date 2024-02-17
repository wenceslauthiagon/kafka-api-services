// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { DefaultModel } from '@zro/common/test';
import { PixStatementCurrentPageEntity } from '@zro/api-topazio/domain';
import { getMoment } from '@zro/common';

/**
 * PixStatementCurrentPage entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixStatementCurrentPageEntity.name);

factory.define<PixStatementCurrentPageEntity>(
  PixStatementCurrentPageEntity.name,
  DefaultModel,
  () => {
    return {
      createdDate: getMoment().format('YYYY-MM-DD'),
      actualPage: 1,
    };
  },
  {
    afterBuild: (model) => {
      return new PixStatementCurrentPageEntity(model);
    },
  },
);

export const PixStatementCurrentPageFactory = factory;
