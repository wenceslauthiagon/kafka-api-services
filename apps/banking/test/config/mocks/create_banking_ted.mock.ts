import {
  CreateBankingTedPspResponse,
  OfflineBankingTedPspException,
} from '@zro/banking/application';
import { v4 as uuidV4 } from 'uuid';

export const success = (): Promise<CreateBankingTedPspResponse> => {
  return Promise.resolve({
    transactionId: uuidV4(),
  });
};

export const offline = (): Promise<OfflineBankingTedPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflineBankingTedPspException(error));
};
