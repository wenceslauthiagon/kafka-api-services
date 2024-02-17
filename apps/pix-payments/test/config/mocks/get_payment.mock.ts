import { v4 as uuidV4 } from 'uuid';
import {
  GetPaymentPixPaymentPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  OperationType,
  PaymentStatusType,
  TransactionType,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

export const successPaymentSettled =
  (pixPaymentZroBankIspb = '26264220') =>
  (): Promise<GetPaymentPixPaymentPspResponse> => {
    return Promise.resolve({
      id: uuidV4(),
      createdAt: new Date(),
      transactionType: TransactionType.CREDIT,
      operation: OperationType.CREDIT,
      status: PaymentStatusType.SETTLED,
      transactionOriginalId: uuidV4(),
      reason: 'Test',
      txId: uuidV4(),
      isDevolution: false,
      amount: 1010,
      clientBankIspb: pixPaymentZroBankIspb,
      clientBranch: uuidV4(),
      clientAccountNumber: uuidV4(),
      clientDocument: uuidV4(),
      clientName: uuidV4(),
      clientKey: uuidV4(),
      thirdPartBankIspb: uuidV4(),
      thirdPartBranch: uuidV4(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: uuidV4(),
      thirdPartDocument: uuidV4(),
      thirdPartName: uuidV4(),
      thirdPartKey: uuidV4(),
      endToEndId: uuidV4(),
      totalDevolution: 0,
      description: uuidV4(),
      initiatorDocument: uuidV4(),
      consentDate: new Date(),
    });
  };

export const successPaymentNotSettled =
  (): Promise<GetPaymentPixPaymentPspResponse> => {
    return Promise.resolve({
      id: uuidV4(),
      createdAt: new Date(),
      transactionType: TransactionType.CREDIT,
      operation: OperationType.CREDIT,
      status: PaymentStatusType.CHARGEBACK,
      transactionOriginalId: uuidV4(),
      reason: 'Test',
      txId: uuidV4(),
      isDevolution: false,
      amount: 1010,
      clientBankIspb: uuidV4(),
      clientBranch: uuidV4(),
      clientAccountNumber: uuidV4(),
      clientDocument: uuidV4(),
      clientName: uuidV4(),
      clientKey: uuidV4(),
      thirdPartBankIspb: uuidV4(),
      thirdPartBranch: uuidV4(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: uuidV4(),
      thirdPartDocument: uuidV4(),
      thirdPartName: uuidV4(),
      thirdPartKey: uuidV4(),
      endToEndId: uuidV4(),
      totalDevolution: 0,
      description: uuidV4(),
      initiatorDocument: uuidV4(),
      consentDate: new Date(),
      errorCode: 'AB03',
    });
  };

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
