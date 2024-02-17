import { v4 as uuidV4 } from 'uuid';
import {
  GetPaymentByIdPixPaymentPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';
import { PaymentStatusType } from '@zro/api-topazio/domain';

export const successPaymentSettled =
  (): Promise<GetPaymentByIdPixPaymentPspResponse> => {
    return Promise.resolve({
      id: uuidV4(),
      status: PaymentStatusType.SETTLED,
      reason: 'Test',
      endToEndId: uuidV4(),
    });
  };

export const successPaymentNotSettled =
  (): Promise<GetPaymentByIdPixPaymentPspResponse> => {
    return Promise.resolve({
      id: uuidV4(),
      status: PaymentStatusType.CHARGEBACK,
      reason: 'Test',
      endToEndId: uuidV4(),
      errorCode: 'AB03',
    });
  };

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
