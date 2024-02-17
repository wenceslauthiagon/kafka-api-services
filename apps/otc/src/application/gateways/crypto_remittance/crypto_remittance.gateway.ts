import { CreateCryptoRemittanceGateway } from './create.gateway';
import { GetCryptoRemittanceByIdGateway } from './get_by_id.gateway';
import { DeleteCryptoRemittanceByIdGateway } from './delete_by_id.gateway';
import { GetCryptoMarketByBaseAndQuoteGateway } from './get_crypto_market_by_base_and_quote.gateway';

export type CryptoRemittanceGateway = CreateCryptoRemittanceGateway &
  DeleteCryptoRemittanceByIdGateway &
  GetCryptoRemittanceByIdGateway &
  GetCryptoMarketByBaseAndQuoteGateway & {
    getProviderName(): string;
  };
