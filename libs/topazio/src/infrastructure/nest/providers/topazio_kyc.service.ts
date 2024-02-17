import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { KycGateway } from '@zro/pix-payments/application';
import {
  TopazioKycGateway,
  TopazioGatewayConfig,
} from '@zro/topazio/infrastructure';

@Injectable()
export class TopazioKycService {
  private readonly clientId: string;
  private readonly baseKycUrl: string;
  private readonly topazioKyc: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<TopazioGatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: TopazioKycService.name });
    this.clientId = this.configService.get<string>(
      'APP_TOPAZIO_AUTH_CLIENT_ID',
    );
    this.baseKycUrl = this.configService.get<string>(
      'APP_TOPAZIO_KYC_BASE_URL',
    );

    this.topazioKyc = axios.create({
      baseURL: this.baseKycUrl,
      headers: {
        'Content-Type': 'application/json',
        client_id: this.clientId,
      },
    });
  }

  getKycGateway(logger?: Logger): KycGateway {
    return new TopazioKycGateway(logger ?? this.logger, this.topazioKyc);
  }
}
