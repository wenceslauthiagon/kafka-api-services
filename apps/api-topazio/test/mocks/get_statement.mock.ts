import { v4 as uuidV4 } from 'uuid';

import { OperationType, TransactionType } from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

export const success = () => {
  return Promise.resolve([
    {
      transactionId: uuidV4(),
      createdAt: new Date(),
      transactionType: TransactionType.CREDIT,
      operation: OperationType.CREDIT,
      status: 'LIQUIDADO',
      transactionOriginalID: uuidV4(),
      reason: null,
      txId: null,
      isDevolution: false,
      amount: 1010.99,
      clientIspb: uuidV4(),
      clientBranch: uuidV4(),
      clientAccountNumber: uuidV4(),
      clientDocument: uuidV4(),
      clientName: uuidV4(),
      clientKey: uuidV4(),
      thirdPartIspb: uuidV4(),
      thirdPartBranch: uuidV4(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: uuidV4(),
      thirdPartDocument: uuidV4(),
      thirdPartName: uuidV4(),
      thirdPartKey: uuidV4(),
      endToEndId: uuidV4(),
      description: uuidV4(),
    },
  ]);
};
