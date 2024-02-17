import { v4 as uuidV4 } from 'uuid';
import {
  CreateQrCodeDynamicPixPaymentPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';

export const success =
  (): Promise<CreateQrCodeDynamicPixPaymentPspResponse> => {
    return Promise.resolve({ emv: uuidV4() });
  };

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
