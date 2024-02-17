import { Currency } from '@zro/operations/domain';
import { CryptoMarket, CryptoRemittanceStatus } from '@zro/otc/domain';

export interface GetCryptoRemittanceByIdRequest {
  providerOrderId: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  market: CryptoMarket;
}

export interface GetCryptoRemittanceByIdResponse {
  id: string;
  providerOrderId: string;
  providerName: string;
  status: CryptoRemittanceStatus;
  executedPrice?: number;
  executedQuantity?: number;
  fee?: number;
}

export interface GetCryptoRemittanceByIdGateway {
  getCryptoRemittanceById(
    data: GetCryptoRemittanceByIdRequest,
  ): Promise<GetCryptoRemittanceByIdResponse>;
}
