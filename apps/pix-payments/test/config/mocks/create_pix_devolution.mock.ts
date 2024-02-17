import { v4 as uuidV4 } from 'uuid';
import {
  CreatePixDevolutionPixPaymentPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';

export const success =
  (): Promise<CreatePixDevolutionPixPaymentPspResponse> => {
    return Promise.resolve({ externalId: uuidV4(), endToEndId: undefined });
  };

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
