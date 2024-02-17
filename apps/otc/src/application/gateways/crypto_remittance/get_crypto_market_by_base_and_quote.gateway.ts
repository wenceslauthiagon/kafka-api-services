import { Currency } from '@zro/operations/domain';
import { CryptoMarket } from '@zro/otc/domain';

export interface GetCryptoMarketByBaseAndQuoteRequest {
  baseCurrency: Currency;
  quoteCurrency: Currency;
}

export type GetCryptoMarketByBaseAndQuoteResponse = CryptoMarket;

export interface GetCryptoMarketByBaseAndQuoteGateway {
  getCryptoMarketByBaseAndQuote(
    request: GetCryptoMarketByBaseAndQuoteRequest,
  ): Promise<GetCryptoMarketByBaseAndQuoteResponse>;
}
