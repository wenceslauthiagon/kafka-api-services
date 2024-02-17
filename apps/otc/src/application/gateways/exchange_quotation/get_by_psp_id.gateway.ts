import { ExchangeQuotationState } from '@zro/otc/domain';

export interface GetExchangeQuotationByPspIdRequest {
  solicitationPspId: string;
}

export interface GetExchangeQuotationByPspIdResponse {
  id: string;
  status: ExchangeQuotationState;
  operation: string;
  internalSettlementDate: Date;
  externalSettlementDate: Date;
  createdDate: Date;
  expiredDate: Date;
  timeExpired: number;
  quotationId: string;
  fxRate: number;
  internalValue: number;
  externalValue: number;
  lastAuthorizedUser: string;
}

export interface GetExchangeQuotationByPspIdGateway {
  getExchangeQuotationById(
    data: GetExchangeQuotationByPspIdRequest,
  ): Promise<GetExchangeQuotationByPspIdResponse>;
}
