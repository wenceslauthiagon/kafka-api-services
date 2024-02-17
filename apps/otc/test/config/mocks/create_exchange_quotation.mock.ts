import { v4 as uuidV4 } from 'uuid';
import {
  CreateExchangeQuotationResponse,
  OfflineExchangeQuotationPspException,
} from '@zro/otc/application';

export const success = (): Promise<CreateExchangeQuotationResponse> =>
  Promise.resolve({
    id: uuidV4(),
    status: 1,
    operation: 'INBOUND',
    internalSettlementDate: new Date(),
    externalSettlementDate: new Date(),
    createdDate: new Date(),
    expiredDate: new Date(),
    timeExpired: 300,
    quotationId: '6320c78b1d3dfc1818938feb',
    fxRate: 520,
    internalValue: 0,
    externalValue: 0,
    gatewayName: 'TOPAZIO',
  });

export const offline = (): Promise<OfflineExchangeQuotationPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflineExchangeQuotationPspException(error));
};
