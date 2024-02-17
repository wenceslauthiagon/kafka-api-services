import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { EncryptService, InjectLogger } from '@zro/common';
import {
  DockAxiosService,
  DockSmsGateway,
  DockGatewayConfig,
} from '@zro/dock/infrastructure';

@Injectable()
export class DockService {
  private readonly dockSmsAxios: AxiosInstance;
  private readonly smsFrom: string;

  constructor(
    @InjectLogger() private logger: Logger,
    configService: ConfigService<DockGatewayConfig>,
    private encryptService: EncryptService,
    dockAxiosService: DockAxiosService,
  ) {
    this.logger = logger.child({ context: DockSmsGateway.name });
    this.smsFrom = configService.get('APP_DOCK_SMS_FROM', 'Zro Bank');
    const baseURL = configService.get<string>('APP_DOCK_SMS_BASE_URL');

    this.dockSmsAxios = dockAxiosService.create({ baseURL });
  }

  getDockSmsGateway(logger?: Logger): DockSmsGateway {
    return new DockSmsGateway(
      logger ?? this.logger,
      this.encryptService,
      this.dockSmsAxios,
      this.smsFrom,
    );
  }
}
