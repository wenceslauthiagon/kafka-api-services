import { ExchangeQuotation } from '@zro/otc/domain';

export type AcceptExchangeQuotationRequest = Pick<
  ExchangeQuotation,
  'quotationPspId' | 'solicitationPspId'
>;

export interface AcceptExchangeQuotationResponse {
  isAccepted: boolean;
}

export interface AcceptExchangeQuotationGateway {
  acceptExchangeQuotation(
    data: AcceptExchangeQuotationRequest,
  ): Promise<AcceptExchangeQuotationResponse>;
}
