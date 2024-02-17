import { Currency } from '@zro/operations/domain';
import { StreamQuotationGateway } from '@zro/quotations/domain';

export type GetStreamQuotationGatewayRequest = {
  baseCurrencies: Currency[];
};

export type GetStreamQuotationGatewayResponse = Pick<
  StreamQuotationGateway,
  | 'id'
  | 'baseCurrency'
  | 'quoteCurrency'
  | 'buy'
  | 'sell'
  | 'amount'
  | 'timestamp'
  | 'gatewayName'
>;

export interface GetStreamQuotationGateway {
  /**
   * Get provider given name.
   */
  getProviderName(): string;

  /**
   * If provider has order service
   */
  hasOrderService(): boolean;

  /**
   * Get current quotations for currencies list.
   *
   * @param request Currency list.
   * @return Quotations found. Empty if not found.
   */
  getQuotation(
    request: GetStreamQuotationGatewayRequest,
  ): Promise<GetStreamQuotationGatewayResponse[]>;

  /**
   * Start provider.
   */
  start(): void;

  /**
   * Stop provider.
   */
  stop(): void;

  /**
   * Set quote currencies.
   */
  setQuoteCurrencies(currencies: Currency[]): void;
}
