import { AcceptExchangeQuotationGateway } from './accept.gateway';
import { RejectExchangeQuotationGateway } from './reject.gateway';
import { CreateExchangeQuotationGateway } from './create.gateway';
import { GetExchangeQuotationByPspIdGateway } from './get_by_psp_id.gateway';

export type ExchangeQuotationGateway = CreateExchangeQuotationGateway &
  AcceptExchangeQuotationGateway &
  RejectExchangeQuotationGateway &
  GetExchangeQuotationByPspIdGateway;
