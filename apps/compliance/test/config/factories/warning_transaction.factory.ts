// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  WarningTransactionEntity,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { OperationEntity } from '@zro/operations/domain';
import { WarningTransactionModel } from '@zro/compliance/infrastructure';

/**
 * Warning transaction factory.
 */
factory.define<WarningTransactionModel>(
  WarningTransactionModel.name,
  WarningTransactionModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      status: WarningTransactionStatus.PENDING,
      transactionTag: 'PIXREC',
      endToEndId: faker.datatype.uuid(),
      issueId: faker.datatype.number(99),
      createdAt: faker.date.recent(999),
      updatedAt: faker.date.recent(999),
    };
  },
);

/**
 * Warning transaction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WarningTransactionEntity.name);

factory.define<WarningTransactionEntity>(
  WarningTransactionEntity.name,
  DefaultModel,
  () => {
    const operation = new OperationEntity({ id: faker.datatype.uuid() });

    return {
      id: faker.datatype.uuid(),
      operation,
      transactionTag: 'PIXREC',
      endToEndId: faker.datatype.uuid(),
      status: WarningTransactionStatus.PENDING,
      issueId: faker.datatype.number(99),
      createdAt: faker.date.recent(999),
      updatedAt: faker.date.recent(999),
    };
  },
  {
    afterBuild: (model) => {
      return new WarningTransactionEntity(model);
    },
  },
);

export const WarningTransactionFactory = factory;
