// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  PaymentStatusType,
  PixStatementEntity,
  OperationType,
  TransactionType,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { getMoment } from '@zro/common';

/**
 * PixStatement entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixStatementEntity.name);

factory.define<PixStatementEntity>(
  PixStatementEntity.name,
  DefaultModel,
  () => {
    return {
      page: 1,
      size: 1,
      createdDate: getMoment().format('YYYY-MM-DD'),
      ttl: 1000,
      statements: [
        {
          transactionId: faker.datatype.uuid(),
          createdAt: new Date(),
          transactionType: TransactionType.CREDIT,
          operation: OperationType.CREDIT,
          status: PaymentStatusType.SETTLED,
          transactionOriginalId: faker.datatype.uuid(),
          reason: null,
          txId: null,
          isDevolution: false,
          amount: 1010.99,
          clientBankIspb: '26264220',
          clientBranch: faker.datatype.uuid(),
          clientAccountNumber: faker.datatype.uuid(),
          clientDocument: faker.datatype.uuid(),
          clientName: faker.datatype.uuid(),
          clientKey: faker.datatype.uuid(),
          thirdPartBankIspb: faker.datatype.uuid(),
          thirdPartBranch: faker.datatype.uuid(),
          thirdPartAccountType: AccountType.CACC,
          thirdPartAccountNumber: faker.datatype.uuid(),
          thirdPartDocument: faker.datatype.uuid(),
          thirdPartName: faker.datatype.uuid(),
          thirdPartKey: faker.datatype.uuid(),
          endToEndId: faker.datatype.uuid(),
          description: faker.datatype.uuid(),
        },
      ],
    };
  },
  {
    afterBuild: (model) => {
      return new PixStatementEntity(model);
    },
  },
);

export const PixStatementFactory = factory;
