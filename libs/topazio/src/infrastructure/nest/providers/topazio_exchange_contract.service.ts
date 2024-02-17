import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { ExchangeContractGateway } from '@zro/otc/application';
import {
  TopazioGatewayConfig,
  TopazioAxiosService,
  TopazioExchangeContractGateway,
} from '@zro/topazio/infrastructure';

@Injectable()
export class TopazioExchangeContractService {
  private readonly exchangeContractUrl: string;
  private readonly topazioExchange: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<TopazioGatewayConfig>,
    private readonly topazioAxios: TopazioAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({
      context: TopazioExchangeContractService.name,
    });
    this.exchangeContractUrl = this.configService.get<string>(
      'APP_TOPAZIO_EXCHANGE_CONTRACT_BASE_URL',
    );

    this.topazioExchange = this.topazioAxios.create({
      baseURL: this.exchangeContractUrl,
    });
  }

  getExchangeContractGateway(logger?: Logger): ExchangeContractGateway {
    return new TopazioExchangeContractGateway(
      logger ?? this.logger,
      this.topazioExchange,
    );
  }
}
