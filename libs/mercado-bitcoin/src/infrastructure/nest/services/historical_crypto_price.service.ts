import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  MercadoBitcoinAxiosPublicService,
  MercadoBitcoinHistoricalCryptoPriceGateway,
  MercadoBitcoinGatewayConfig,
} from '@zro/mercado-bitcoin/infrastructure';

@Injectable()
export class MercadoBitcoinHistoricalCryptoPriceService {
  private readonly axios: AxiosInstance;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<MercadoBitcoinGatewayConfig>,
    readonly axiosMb: MercadoBitcoinAxiosPublicService,
  ) {
    this.logger = logger.child({
      context: MercadoBitcoinHistoricalCryptoPriceService.name,
    });

    const baseURL = this.configService.get<string>(
      'APP_MERCADO_BITCOIN_HISTORICAL_PRICE_BASE_URL',
    );

    if (!baseURL) {
      throw new MissingEnvVarException([
        'APP_MERCADO_BITCOIN_HISTORICAL_PRICE_BASE_URL',
      ]);
    }

    this.axios = axiosMb.create({ baseURL });
  }

  getMercadoBitcoinHistoricalCryptoPriceGateway(
    logger?: Logger,
  ): MercadoBitcoinHistoricalCryptoPriceGateway {
    return new MercadoBitcoinHistoricalCryptoPriceGateway(
      logger ?? this.logger,
      this.axios,
    );
  }
}
