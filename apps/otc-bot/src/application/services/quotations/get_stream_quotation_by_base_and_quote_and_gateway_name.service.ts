import { StreamQuotation } from '@zro/quotations/domain';

export type GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceRequest = Pick<
  Required<StreamQuotation>,
  'baseCurrency' | 'quoteCurrency' | 'gatewayName'
>;

export type GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceResponse =
  Omit<Required<StreamQuotation>, 'isSynthetic'>;

export interface GetStreamQuotationByBaseAndQuoteAndGatewayNameService {
  /**
   * Get stream quotation from a pair of a provider
   */
  getStreamQuotationByBaseAndQuoteAndGatewayName(
    request: GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceRequest,
  ): Promise<GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceResponse>;
}
