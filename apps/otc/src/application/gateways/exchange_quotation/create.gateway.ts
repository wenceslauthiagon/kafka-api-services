import { Currency } from '@zro/operations/domain';
import { Remittance } from '@zro/otc/domain';

export type CreateExchangeQuotationRequest = Pick<
  Remittance,
  'side' | 'amount' | 'sendDate' | 'receiveDate'
> & { zroBankPartnerId: number; currencyTag: Currency['tag'] };

export interface CreateExchangeQuotationResponse {
  id: string;
  status: number;
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
  gatewayName: string;
}

export interface CreateExchangeQuotationGateway {
  createExchangeQuotation(
    data: CreateExchangeQuotationRequest,
  ): Promise<CreateExchangeQuotationResponse>;
}
