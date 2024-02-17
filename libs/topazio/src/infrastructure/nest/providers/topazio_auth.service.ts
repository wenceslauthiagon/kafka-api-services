import { Logger } from 'winston';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio/infrastructure';

@Injectable()
export class TopazioAuthService implements OnModuleInit {
  private readonly appEnv: string;
  private readonly baseAuthUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService<TopazioGatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: TopazioAuthService.name });
    this.appEnv = this.configService.get<string>('APP_ENV');
    this.baseAuthUrl = this.configService.get<string>(
      'APP_TOPAZIO_AUTH_BASE_URL',
    );
    this.clientId = this.configService.get<string>(
      'APP_TOPAZIO_AUTH_CLIENT_ID',
    );
    this.clientSecret = this.configService.get<string>(
      'APP_TOPAZIO_AUTH_CLIENT_SECRET',
    );

    if (!this.baseAuthUrl || !this.clientId || !this.clientSecret) {
      throw new MissingEnvVarException([
        ...(!this.baseAuthUrl ? ['APP_TOPAZIO_AUTH_BASE_URL'] : []),
        ...(!this.clientId ? ['APP_TOPAZIO_AUTH_CLIENT_ID'] : []),
        ...(!this.clientSecret ? ['APP_TOPAZIO_AUTH_CLIENT_SECRET'] : []),
      ]);
    }
  }

  onModuleInit() {
    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: this.appEnv,
      baseUrl: this.baseAuthUrl,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };
    TopazioAuthGateway.build(authConfig);
    TopazioAuthGateway.getAccessToken(this.logger);
  }
}
