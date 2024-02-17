import { Logger } from 'winston';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import {
  ZroBankAuthGateway,
  ZroBankAuthGatewayConfig,
  ZroBankGatewayConfig,
} from '@zro/zrobank/infrastructure';

@Injectable()
export class ZroBankPixAuthService implements OnModuleInit {
  private readonly appEnv: string;
  private readonly baseAuthUrl: string;
  private readonly apiId: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService<ZroBankGatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: ZroBankPixAuthService.name });
    this.appEnv = this.configService.get<string>('APP_ENV');
    this.baseAuthUrl = this.configService.get<string>(
      'APP_ZROBANK_API_PAAS_BASE_URL',
    );
    this.apiId = this.configService.get<string>('APP_ZROBANK_API_PAAS_ID');
    this.apiKey = this.configService.get<string>('APP_ZROBANK_API_PAAS_KEY');
  }

  onModuleInit() {
    const authConfig: ZroBankAuthGatewayConfig = {
      appEnv: this.appEnv,
      baseUrl: this.baseAuthUrl,
      apiId: this.apiId,
      apiKey: this.apiKey,
    };
    ZroBankAuthGateway.build(authConfig);
    ZroBankAuthGateway.getAccessToken(this.logger);
  }
}
