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
} from '@zro/otc/application';
import {
  B2C2GetCryptoRemittanceByIdGateway,
  B2C2GetCryptoMarketsGateway,
  B2C2CreateCryptoRemittanceGateway,
  B2C2_PROVIDER_NAME,
} from '@zro/b2c2/infrastructure';
import { CryptoMarket } from '@zro/otc/domain';

export class B2C2CryptoRemittanceGateway implements CryptoRemittanceGateway {
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private cache: Cache,
  ) {
    this.logger = logger.child({ context: B2C2CryptoRemittanceGateway.name });
  }

  getProviderName(): string {
    return B2C2_PROVIDER_NAME;
  }

  getCryptoMarketByBaseAndQuote(
    request: GetCryptoMarketByBaseAndQuoteRequest,
  ): Promise<CryptoMarket> {
    this.logger.debug('Get market', { request });

    const gateway = new B2C2GetCryptoMarketsGateway(this.logger, this.cache);

    return gateway.getCryptoMarketByBaseAndQuote(request);
  }

  createCryptoRemittance(
    request: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse> {
    this.logger.debug('Create order request.', { request });

    const gateway = new B2C2CreateCryptoRemittanceGateway(
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

    const gateway = new B2C2GetCryptoRemittanceByIdGateway(
      this.logger,
      this.axios,
    );

    return gateway.getCryptoRemittanceById(request);
  }

  // This method is not supported by the B2C2 API
  deleteCryptoRemittanceById(
    request: DeleteCryptoRemittanceByIdRequest,
  ): Promise<DeleteCryptoRemittanceByIdResponse> {
    this.logger.debug('Delete order by id request.', { request });

    throw new NotImplementedException('DeleteOrderByIdConversion method');
  }
}
