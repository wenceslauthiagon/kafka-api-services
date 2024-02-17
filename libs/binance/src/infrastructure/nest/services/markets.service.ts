import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectCache, InjectLogger } from '@zro/common';
import {
  BinanceAxiosService,
  BinanceUpdateMarketsGateway,
} from '@zro/binance/infrastructure';

@Injectable()
export class BinanceGetMarketsService implements OnModuleInit, OnModuleDestroy {
  private readonly gateway: BinanceUpdateMarketsGateway;

  constructor(
    @InjectCache() readonly cache: Cache,
    @InjectLogger() readonly logger: Logger,
    readonly binanceAxiosService: BinanceAxiosService,
  ) {
    const axiosInstance = binanceAxiosService.createPublic();

    this.gateway = new BinanceUpdateMarketsGateway({
      logger,
      cache,
      axiosInstance,
    });
  }

  onModuleInit() {
    this.gateway.start();
  }

  onModuleDestroy() {
    this.gateway?.stop();
  }
}
