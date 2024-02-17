import { GetStreamPairByIdService } from './get_stream_pair_by_id.service';
import { GetStreamQuotationByBaseAndQuoteAndGatewayNameService } from './get_stream_quotation_by_base_and_quote_and_gateway_name.service';
import { GetTaxByNameService } from './get_tax_by_name.service';

export type QuotationService =
  GetStreamQuotationByBaseAndQuoteAndGatewayNameService &
    GetStreamPairByIdService &
    GetTaxByNameService;
