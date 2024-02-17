import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { EncryptService, InjectLogger } from '@zro/common';
import { ZenviaGateway } from '@zro/zenvia/infrastructure/gateways/zenvia.gateway';
import { ZenviaGatewayConfig } from '@zro/zenvia/infrastructure/config/zenvia.config';

@Injectable()
export class ZenviaService {
  private readonly baseUrl: string;
  private readonly aggregateId: string;
  private readonly auth: string;
  private readonly zenvia: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<ZenviaGatewayConfig>,
    private readonly encryptService: EncryptService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.aggregateId = this.configService.get('APP_ZENVIA_SMS_AGGREGATE_ID');
    this.logger = logger.child({ context: ZenviaGateway.name });
    this.baseUrl = this.configService.get('APP_ZENVIA_SMS_BASE_URL');
    this.auth = this.configService.get('APP_ZENVIA_SMS_AUTH');

    this.zenvia = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
    });
  }

  getZenviaGateway(logger?: Logger): ZenviaGateway {
    return new ZenviaGateway(
      logger ?? this.logger,
      this.aggregateId,
      this.encryptService,
      this.zenvia,
    );
  }
}
