import {
  InvalidGetRefundNotFoundPixPaymentPspException,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';

export const successApproved = () => {
  return {
    id: '',
    status: 'APPROVED',
    operation: '',
    timeExpired: 0,
    quotationId: '',
    fxRate: 0,
    internalValue: 0,
    externalValue: 0,
    lastAuthorizedUser: '',
    internalSettlementDate: '',
    externalSettlementDate: '',
    createdDate: '',
    expiredDate: '',
  };
};

export const successCompleted = () => {
  return {
    id: '',
    status: 'COMPLETED',
    operation: '',
    timeExpired: 0,
    quotationId: '',
    fxRate: 0,
    internalValue: 0,
    externalValue: 0,
    lastAuthorizedUser: '',
    internalSettlementDate: '',
    externalSettlementDate: '',
    createdDate: '',
    expiredDate: '',
  };
};

export const successCanceled = () => {
  return {
    id: '',
    status: 'CANCELED',
    operation: '',
    timeExpired: 0,
    quotationId: '',
    fxRate: 0,
    internalValue: 0,
    externalValue: 0,
    lastAuthorizedUser: '',
    internalSettlementDate: '',
    externalSettlementDate: '',
    createdDate: '',
    expiredDate: '',
  };
};

export const failedNotfound =
  (): Promise<InvalidGetRefundNotFoundPixPaymentPspException> => {
    const error = 'Refund not found';
    return Promise.reject(
      new InvalidGetRefundNotFoundPixPaymentPspException(error),
    );
  };

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
