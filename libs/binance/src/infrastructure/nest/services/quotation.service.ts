import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectCache, InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  BinanceGatewayConfig,
  BinanceGetCryptoMarketsGateway,
  BinanceGetStreamQuotationGateway,
  BinanceChannel,
} from '@zro/binance/infrastructure';
import { GetStreamQuotationGateway } from '@zro/quotations/application';
import {
  GetStreamQuotationService,
  StreamQuotationGatewayController,
} from '@zro/quotations/infrastructure';

@Injectable()
@StreamQuotationGatewayController()
export class BinanceQuotationService
  implements GetStreamQuotationService, OnModuleDestroy
{
  private readonly gateway: BinanceGetStreamQuotationGateway;

  constructor(
    @InjectCache() readonly cache: Cache,
    @InjectLogger() readonly logger: Logger,
    readonly configService: ConfigService<BinanceGatewayConfig>,
  ) {
    const ttl = Number(
      configService.get('APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS', '10000'),
    );

    const websocketURL = configService.get('APP_BINANCE_WEBSOCKET_URL');
    const channel = this.configService.get<BinanceChannel>(
      'APP_BINANCE_SUBSCRIBE_TYPE',
    );

    if (!websocketURL || !channel) {
      throw new MissingEnvVarException([
        ...(!websocketURL ? ['APP_BINANCE_WEBSOCKET_URL'] : []),
        ...(!channel ? ['APP_BINANCE_SUBSCRIBE_TYPE'] : []),
      ]);
    }

    const marketGateway = new BinanceGetCryptoMarketsGateway(
      this.cache,
      this.logger,
    );

    this.gateway = new BinanceGetStreamQuotationGateway({
      cache,
      logger,
      websocketURL,
      channel,
      marketGateway,
      ttl,
    });
  }

  getGateway(): GetStreamQuotationGateway {
    return this.gateway;
  }

  onModuleDestroy() {
    this.gateway?.stop();
  }
}
