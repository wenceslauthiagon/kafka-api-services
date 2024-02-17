import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { ExchangeQuotationGateway } from '@zro/otc/application';
import {
  TopazioGatewayConfig,
  TopazioAxiosService,
  TopazioExchangeQuotationGateway,
} from '@zro/topazio/infrastructure';

@Injectable()
export class TopazioExchangeQuotationService {
  private readonly exchangeQuotationUrl: string;
  private readonly topazioExchange: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<TopazioGatewayConfig>,
    private readonly topazioAxios: TopazioAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({
      context: TopazioExchangeQuotationService.name,
    });
    this.exchangeQuotationUrl = this.configService.get<string>(
      'APP_TOPAZIO_EXCHANGE_QUOTATION_BASE_URL',
    );

    this.topazioExchange = this.topazioAxios.create({
      baseURL: this.exchangeQuotationUrl,
    });
  }

  getExchangeQuotationGateway(logger?: Logger): ExchangeQuotationGateway {
    return new TopazioExchangeQuotationGateway(
      logger ?? this.logger,
      this.topazioExchange,
    );
  }
}
