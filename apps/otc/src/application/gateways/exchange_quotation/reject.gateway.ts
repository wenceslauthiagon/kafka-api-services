import { ExchangeQuotation } from '@zro/otc/domain';

export type RejectExchangeQuotationRequest = Pick<
  ExchangeQuotation,
  'solicitationPspId'
>;

export interface RejectExchangeQuotationGateway {
  rejectExchangeQuotation(data: RejectExchangeQuotationRequest): Promise<void>;
}
