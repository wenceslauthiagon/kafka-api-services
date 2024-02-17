import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InjectCache, InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  MercadoBitcoinGatewayConfig,
  MercadoBitcoinGetCryptoMarketsGateway,
  MercadoBitcoinGetMarketsService,
  MercadoBitcoinGetStreamQuotationGateway,
  MercadoBitcoinSubscribeType,
} from '@zro/mercado-bitcoin/infrastructure';
import { GetStreamQuotationGateway } from '@zro/quotations/application';
import {
  GetStreamQuotationService,
  StreamQuotationGatewayController,
} from '@zro/quotations/infrastructure';

@Injectable()
@StreamQuotationGatewayController()
export class MercadoBitcoinGetStreamQuotationService
  implements GetStreamQuotationService, OnModuleDestroy
{
  private gateway: MercadoBitcoinGetStreamQuotationGateway;

  constructor(
    @InjectCache() readonly cache: Cache,
    @InjectLogger() readonly logger: Logger,
    readonly getMarketsService: MercadoBitcoinGetMarketsService,
    readonly configService: ConfigService<MercadoBitcoinGatewayConfig>,
  ) {
    const websocketURL = this.configService.get(
      'APP_MERCADO_BITCOIN_WEBSOCKET_URL',
    );
    const baseURL = this.configService.get<string>(
      'APP_MERCADO_BITCOIN_BASE_URL',
    );
    const subscriptionType =
      this.configService.get<MercadoBitcoinSubscribeType>(
        'APP_MERCADO_BITCOIN_SUBSCRIBE_TYPE',
        MercadoBitcoinSubscribeType.TICKER,
      );
    const orderbookDepth = parseInt(
      this.configService.get<string>(
        'APP_MERCADO_BITCOIN_ORDERBOOK_DEPTH',
        '50',
      ),
    );
    const ttl = Number(
      configService.get('APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS', '10000'),
    );

    if (!websocketURL || !baseURL) {
      throw new MissingEnvVarException([
        ...(!baseURL ? ['APP_MERCADO_BITCOIN_BASE_URL'] : []),
        ...(!websocketURL ? ['APP_MERCADO_BITCOIN_WEBSOCKET_URL'] : []),
      ]);
    }

    const marketGateway = new MercadoBitcoinGetCryptoMarketsGateway(
      this.logger,
      this.cache,
    );

    this.gateway = new MercadoBitcoinGetStreamQuotationGateway({
      cache,
      logger,
      websocketURL,
      subscriptionType,
      orderbookDepth,
      marketGateway,
      ttl,
    });
  }

  onModuleDestroy() {
    this.gateway?.stop();
  }

  getGateway(): GetStreamQuotationGateway {
    return this.gateway;
  }
}
