import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  GetHistoricalCryptoPriceRequest,
  GetHistoricalCryptoPriceResponse,
  HistoricalCryptoPriceGateway,
} from '@zro/otc/application';
import { MercadoBitcoinGetHistoricalCryptoPriceGateway } from './get_historical_crypto_price.gateway';

export class MercadoBitcoinHistoricalCryptoPriceGateway
  implements HistoricalCryptoPriceGateway
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = this.logger.child({
      context: MercadoBitcoinHistoricalCryptoPriceGateway.name,
    });
  }

  getHistoricalCryptoPrice(
    request: GetHistoricalCryptoPriceRequest,
  ): Promise<GetHistoricalCryptoPriceResponse> {
    this.logger.debug('Get historical crypto price', { request });

    const gateway = new MercadoBitcoinGetHistoricalCryptoPriceGateway(
      this.logger,
      this.axios,
    );

    return gateway.getHistoricalCryptoPrice(request);
  }
}
