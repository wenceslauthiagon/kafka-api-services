import { Currency } from '@zro/operations/domain';

export interface GetHistoricalCryptoPriceRequest {
  currency: Currency;
  createdAt: Date;
}

export interface GetHistoricalCryptoPriceResponse {
  estimatedPrice: number;
}

export interface GetHistoricalCryptoPriceGateway {
  getHistoricalCryptoPrice(
    data: GetHistoricalCryptoPriceRequest,
  ): Promise<GetHistoricalCryptoPriceResponse>;
}
