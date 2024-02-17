import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { Cache } from 'cache-manager';
import { NotImplementedException } from '@zro/common';
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
import {
  MercadoBitcoinCreateCryptoRemittanceGateway,
  MercadoBitcoinGetCryptoRemittanceByIdGateway,
  MercadoBitcoinGetCryptoMarketsGateway,
  MERCADO_BITCOIN_PROVIDER_NAME,
} from '@zro/mercado-bitcoin/infrastructure';

export class MercadoBitcoinCryptoRemittanceGateway
  implements CryptoRemittanceGateway
{
  constructor(
    private readonly logger: Logger,
    private readonly mbAxios: AxiosInstance,
    private readonly accountId: string,
    private readonly cache: Cache,
  ) {
    this.logger = this.logger.child({
      context: MercadoBitcoinCryptoRemittanceGateway.name,
    });
  }

  getProviderName(): string {
    return MERCADO_BITCOIN_PROVIDER_NAME;
  }

  getCryptoMarketByBaseAndQuote(
    request: GetCryptoMarketByBaseAndQuoteRequest,
  ): Promise<GetCryptoMarketByBaseAndQuoteResponse> {
    this.logger.debug('Get market by base and quote', { request });

    const gateway = new MercadoBitcoinGetCryptoMarketsGateway(
      this.logger,
      this.cache,
    );

    return gateway.getCryptoMarketByBaseAndQuote(request);
  }

  createCryptoRemittance(
    request: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse> {
    this.logger.debug('Create order request.', { request });

    const gateway = new MercadoBitcoinCreateCryptoRemittanceGateway(
      this.logger,
      this.mbAxios,
      this.accountId,
      this.cache,
    );

    return gateway.createCryptoRemittance(request);
  }

  getCryptoRemittanceById(
    request: GetCryptoRemittanceByIdRequest,
  ): Promise<GetCryptoRemittanceByIdResponse> {
    this.logger.debug('Get order by id request.', { request });

    const gateway = new MercadoBitcoinGetCryptoRemittanceByIdGateway(
      this.logger,
      this.mbAxios,
      this.accountId,
      this.cache,
    );

    return gateway.getCryptoRemittanceById(request);
  }

  // This method is not supported by the MercadoBitcoin API
  deleteCryptoRemittanceById(
    request: DeleteCryptoRemittanceByIdRequest,
  ): Promise<DeleteCryptoRemittanceByIdResponse> {
    this.logger.debug('Delete order by id request.', { request });

    throw new NotImplementedException('DeleteOrderByIdConversion method');
  }
}
