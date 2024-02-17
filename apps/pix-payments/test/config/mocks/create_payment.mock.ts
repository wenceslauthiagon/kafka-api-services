import { v4 as uuidV4 } from 'uuid';
import {
  CreatePaymentPixPaymentPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';

export const success = (): Promise<CreatePaymentPixPaymentPspResponse> => {
  return Promise.resolve({ externalId: uuidV4() });
};

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
