import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { Cache } from 'cache-manager';
import { Injectable } from '@nestjs/common';
import { InjectCache, InjectLogger } from '@zro/common';
import {
  BinanceAxiosService,
  BinanceCryptoRemittanceGateway,
} from '@zro/binance/infrastructure';

@Injectable()
export class BinanceCryptoRemittanceService {
  private readonly binanceConversion: AxiosInstance;

  constructor(
    @InjectCache() private readonly cache: Cache,
    @InjectLogger() private readonly logger: Logger,
    readonly binanceAxiosService: BinanceAxiosService,
  ) {
    this.logger = this.logger.child({
      context: BinanceCryptoRemittanceService.name,
    });
    this.binanceConversion = binanceAxiosService.create();
  }

  getBinanceCryptoRemittanceGateway(logger?: Logger) {
    return new BinanceCryptoRemittanceGateway(
      logger ?? this.logger,
      this.binanceConversion,
      this.cache,
    );
  }
}
