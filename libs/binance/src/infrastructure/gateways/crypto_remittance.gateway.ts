import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { Cache } from 'cache-manager';
import {
  CreateCryptoRemittanceRequest,
  CreateCryptoRemittanceResponse,
  DeleteCryptoRemittanceByIdRequest,
  DeleteCryptoRemittanceByIdResponse,
  GetCryptoRemittanceByIdRequest,
  GetCryptoRemittanceByIdResponse,
  CryptoRemittanceGateway,
  GetCryptoMarketByBaseAndQuoteRequest,
  GetCryptoMarketByBaseAndQuoteResponse,
} from '@zro/otc/application';
import { BINANCE_PROVIDER_NAME } from './services.constants';
import { BinanceGetCryptoMarketsGateway } from './get_crypto_market_by_base_and_quote.gateway';
import { BinanceCreateCryptoRemittanceGateway } from './create_crypto_remittance.gateway';
import { BinanceGetCryptoRemittanceByIdGateway } from './get_crypto_remittance_by_id.gateway';
import { BinanceDeleteCryptoRemittanceByIdGateway } from './delete_crypto_remittance_by_id.gateway';

export class BinanceCryptoRemittanceGateway implements CryptoRemittanceGateway {
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private cache: Cache,
  ) {
    this.logger = logger.child({
      context: BinanceCryptoRemittanceGateway.name,
    });
  }

  getProviderName(): string {
    return BINANCE_PROVIDER_NAME;
  }

  getCryptoMarketByBaseAndQuote(
    request: GetCryptoMarketByBaseAndQuoteRequest,
  ): Promise<GetCryptoMarketByBaseAndQuoteResponse> {
    this.logger.debug('Get markets request.', { request });

    const gateway = new BinanceGetCryptoMarketsGateway(this.cache, this.logger);

    return gateway.getCryptoMarketByBaseAndQuote(request);
  }

  createCryptoRemittance(
    request: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse> {
    this.logger.debug('Create order request.', { request });

    const gateway = new BinanceCreateCryptoRemittanceGateway(
      this.cache,
      this.logger,
      this.axios,
    );

    return gateway.createCryptoRemittance(request);
  }

  getCryptoRemittanceById(
    request: GetCryptoRemittanceByIdRequest,
  ): Promise<GetCryptoRemittanceByIdResponse> {
    this.logger.debug('Get order by id request.', { request });

    const gateway = new BinanceGetCryptoRemittanceByIdGateway(
      this.logger,
      this.axios,
    );

    return gateway.getCryptoRemittanceById(request);
  }

  deleteCryptoRemittanceById(
    request: DeleteCryptoRemittanceByIdRequest,
  ): Promise<DeleteCryptoRemittanceByIdResponse> {
    this.logger.debug('Delete order by id request.', { request });

    const gateway = new BinanceDeleteCryptoRemittanceByIdGateway(
      this.logger,
      this.axios,
    );

    return gateway.deleteCryptoRemittanceById(request);
  }
}
