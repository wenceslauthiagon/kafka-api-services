import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectCache, InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  B2C2GatewayConfig,
  B2C2GetCryptoMarketsGateway,
  B2C2GetStreamQuotationGateway,
} from '@zro/b2c2/infrastructure';
import { GetStreamQuotationGateway } from '@zro/quotations/application';
import {
  GetStreamQuotationService,
  StreamQuotationGatewayController,
} from '@zro/quotations/infrastructure';

@Injectable()
@StreamQuotationGatewayController()
export class B2C2QuotationService
  implements GetStreamQuotationService, OnModuleDestroy
{
  private readonly gateway: B2C2GetStreamQuotationGateway;

  constructor(
    @InjectCache() readonly cache: Cache,
    @InjectLogger() readonly logger: Logger,
    readonly configService: ConfigService<B2C2GatewayConfig>,
  ) {
    const ttl = Number(
      configService.get('APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS', '10000'),
    );

    const websocketURL = configService.get('APP_B2C2_WEBSOCKET_URL');
    const token = configService.get('APP_B2C2_AUTH_TOKEN');

    if (!websocketURL || !token) {
      throw new MissingEnvVarException([
        ...(!token ? ['APP_B2C2_AUTH_TOKEN'] : []),
        ...(!websocketURL ? ['APP_B2C2_WEBSOCKET_URL'] : []),
      ]);
    }

    const marketGateway = new B2C2GetCryptoMarketsGateway(
      this.logger,
      this.cache,
    );

    this.gateway = new B2C2GetStreamQuotationGateway({
      cache,
      logger,
      websocketURL,
      token,
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
