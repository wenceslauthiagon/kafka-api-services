import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { EncryptService, InjectLogger } from '@zro/common';
import {
  BulksmsGateway,
  BulksmsGatewayConfig,
} from '@zro/bulksms/infrastructure';

@Injectable()
export class BulksmsService {
  private readonly baseUrl: string;
  private readonly auth: string;
  private readonly bulksms: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<BulksmsGatewayConfig>,
    private readonly encryptService: EncryptService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: BulksmsGateway.name });
    this.baseUrl = this.configService.get('APP_BULKSMS_SMS_BASE_URL');
    this.auth = this.configService.get('APP_BULKSMS_SMS_AUTH');

    this.bulksms = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
    });
  }

  getBulksmsGateway(logger?: Logger): BulksmsGateway {
    return new BulksmsGateway(
      logger ?? this.logger,
      this.encryptService,
      this.bulksms,
    );
  }
}
