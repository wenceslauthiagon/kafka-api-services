import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { InjectCache, InjectLogger } from '@zro/common';
import {
  B2C2AxiosService,
  B2C2UpdateMarketsGateway,
} from '@zro/b2c2/infrastructure';

@Injectable()
export class B2C2GetMarketsService implements OnModuleInit, OnModuleDestroy {
  private readonly gateway: B2C2UpdateMarketsGateway;

  constructor(
    @InjectCache() readonly cache: Cache,
    @InjectLogger() readonly logger: Logger,
    readonly b2c2AxiosService: B2C2AxiosService,
  ) {
    const axiosInstance = b2c2AxiosService.create();

    this.gateway = new B2C2UpdateMarketsGateway({
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
