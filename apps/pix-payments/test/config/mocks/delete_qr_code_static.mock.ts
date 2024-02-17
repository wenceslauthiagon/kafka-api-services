import { OfflinePixPaymentPspException } from '@zro/pix-payments/application';

export const success = (): Promise<void> => Promise.resolve();

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
