import {
  AcceptExchangeQuotationResponse,
  OfflineExchangeQuotationPspException,
} from '@zro/otc/application';

export const success = (): Promise<AcceptExchangeQuotationResponse> =>
  Promise.resolve({
    isAccepted: true,
  });

export const offline = (): Promise<OfflineExchangeQuotationPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflineExchangeQuotationPspException(error));
};
