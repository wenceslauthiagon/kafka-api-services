import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { Cache } from 'cache-manager';
import { Injectable } from '@nestjs/common';
import { InjectCache, InjectLogger } from '@zro/common';
import {
  B2C2AxiosService,
  B2C2CryptoRemittanceGateway,
} from '@zro/b2c2/infrastructure';

@Injectable()
export class B2C2CryptoRemittanceService {
  private readonly b2c2Conversion: AxiosInstance;

  constructor(
    @InjectCache() private readonly cache: Cache,
    @InjectLogger() private readonly logger: Logger,
    readonly b2c2AxiosService: B2C2AxiosService,
  ) {
    this.logger = this.logger.child({
      context: B2C2CryptoRemittanceService.name,
    });
    this.b2c2Conversion = b2c2AxiosService.create();
  }

  getB2C2CryptoRemittanceGateway(logger?: Logger) {
    return new B2C2CryptoRemittanceGateway(
      logger ?? this.logger,
      this.b2c2Conversion,
      this.cache,
    );
  }
}
