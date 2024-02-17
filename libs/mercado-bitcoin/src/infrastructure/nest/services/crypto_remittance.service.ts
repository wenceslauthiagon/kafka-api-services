import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { Cache } from 'cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MercadoBitcoinAxiosService,
  MercadoBitcoinCryptoRemittanceGateway,
  MercadoBitcoinGatewayConfig,
} from '@zro/mercado-bitcoin/infrastructure';
import { InjectCache, InjectLogger, MissingEnvVarException } from '@zro/common';

@Injectable()
export class MercadoBitcoinCryptoRemittanceService {
  private readonly axiosConversion: AxiosInstance;
  private readonly accountId: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    @InjectCache() private readonly cache: Cache,
    private readonly configService: ConfigService<MercadoBitcoinGatewayConfig>,
    private axios: MercadoBitcoinAxiosService,
  ) {
    this.logger = logger.child({
      context: MercadoBitcoinCryptoRemittanceService.name,
    });

    const baseURL = this.configService.get<string>(
      'APP_MERCADO_BITCOIN_BASE_URL',
    );
    this.accountId = this.configService.get<string>(
      'APP_MERCADO_BITCOIN_ACCOUNT_ID',
    );

    if (!this.accountId || !baseURL) {
      throw new MissingEnvVarException([
        ...(!baseURL ? ['APP_MERCADO_BITCOIN_BASE_URL'] : []),
        ...(!this.accountId ? ['APP_MERCADO_BITCOIN_ACCOUNT_ID'] : []),
      ]);
    }

    this.axiosConversion = this.axios.create({ baseURL });
  }

  getMercadoBitcoinCryptoRemittanceGateway(
    logger?: Logger,
  ): MercadoBitcoinCryptoRemittanceGateway {
    return new MercadoBitcoinCryptoRemittanceGateway(
      logger ?? this.logger,
      this.axiosConversion,
      this.accountId,
      this.cache,
    );
  }
}
