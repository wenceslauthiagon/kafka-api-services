import { Logger } from 'winston';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, MissingEnvVarException } from '@zro/common';
import {
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
} from '@zro/jdpi/infrastructure';

@Injectable()
export class JdpiPixAuthService implements OnModuleInit {
  private readonly appEnv: string;
  private readonly baseAuthUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    configService: ConfigService<JdpiGatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: JdpiPixAuthService.name });
    this.appEnv = configService.get<string>('APP_ENV');
    this.baseAuthUrl = configService.get<string>('APP_JDPI_BASE_URL');
    this.clientId = configService.get<string>('APP_JDPI_AUTH_CLIENT_ID');
    this.clientSecret = configService.get<string>(
      'APP_JDPI_AUTH_CLIENT_SECRET',
    );

    if (!this.baseAuthUrl || !this.clientId || !this.clientSecret) {
      throw new MissingEnvVarException([
        ...(!this.baseAuthUrl ? ['APP_JDPI_BASE_URL'] : []),
        ...(!this.clientId ? ['APP_JDPI_AUTH_CLIENT_ID'] : []),
        ...(!this.clientSecret ? ['APP_JDPI_AUTH_CLIENT_SECRET'] : []),
      ]);
    }
  }

  onModuleInit() {
    const authConfig: JdpiAuthGatewayConfig = {
      appEnv: this.appEnv,
      baseUrl: this.baseAuthUrl,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };
    JdpiAuthGateway.build(authConfig);
    JdpiAuthGateway.getAccessToken(this.logger);
  }
}
