import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InjectCache, InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  MercadoBitcoinGatewayConfig,
  MercadoBitcoinUpdateMarketsGateway,
} from '@zro/mercado-bitcoin/infrastructure';

@Injectable()
export class MercadoBitcoinGetMarketsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly gateway: MercadoBitcoinUpdateMarketsGateway;

  constructor(
    @InjectCache() readonly cache: Cache,
    @InjectLogger() readonly logger: Logger,
    readonly configService: ConfigService<MercadoBitcoinGatewayConfig>,
  ) {
    const baseURL = configService.get<string>('APP_MERCADO_BITCOIN_BASE_URL');

    if (!baseURL) {
      throw new MissingEnvVarException(['APP_MERCADO_BITCOIN_BASE_URL']);
    }

    this.gateway = new MercadoBitcoinUpdateMarketsGateway({
      logger,
      cache,
      baseURL,
    });
  }

  onModuleInit() {
    this.gateway.start();
  }

  onModuleDestroy() {
    this.gateway?.stop();
  }
}
