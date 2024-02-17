import { Logger } from 'winston';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import {
  GenialAuthGateway,
  GenialAuthGatewayConfig,
  GenialGatewayConfig,
} from '@zro/genial/infrastructure';

@Injectable()
export class GenialPixAuthService implements OnModuleInit {
  private readonly appEnv: string;
  private readonly baseAuthUrl: string;
  private readonly authTokenAuthorization: string;

  constructor(
    private readonly configService: ConfigService<GenialGatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: GenialPixAuthService.name });
    this.appEnv = this.configService.get<string>('APP_ENV');
    this.baseAuthUrl = this.configService.get<string>(
      'APP_GENIAL_AUTH_BASE_URL',
    );
    this.authTokenAuthorization = this.configService.get<string>(
      'APP_GENIAL_AUTH_TOKEN',
    );
  }

  onModuleInit() {
    const authConfig: GenialAuthGatewayConfig = {
      appEnv: this.appEnv,
      baseUrl: this.baseAuthUrl,
      basicAuthorization: this.authTokenAuthorization,
    };
    GenialAuthGateway.build(authConfig);
    GenialAuthGateway.getAccessToken(this.logger);
  }
}
