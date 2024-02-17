import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { PixPaymentGateway } from '@zro/pix-zro-pay/application';
import {
  ZroBankGatewayConfig,
  ZroBankPixPaymentGateway,
} from '@zro/zrobank/infrastructure';
import { ZroBankAxiosService } from '@zro/zrobank/infrastructure/utils/zrobank_axios.util';
import { PaymentGatewayServiceController } from '@zro/pix-zro-pay/infrastructure';

@Injectable()
@PaymentGatewayServiceController()
export class ZroBankPixService {
  private readonly baseApiPaasUrl: string;
  private readonly zrobankPaas: AxiosInstance;

  private readonly gateway: ZroBankPixPaymentGateway;

  constructor(
    private readonly configService: ConfigService<ZroBankGatewayConfig>,
    private readonly zrobankAxios: ZroBankAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: ZroBankPixService.name });

    this.baseApiPaasUrl = this.configService.get<string>(
      'APP_ZROBANK_API_PAAS_BASE_URL',
    );

    this.zrobankPaas = this.zrobankAxios.create({
      baseURL: this.baseApiPaasUrl,
    });

    this.gateway = new ZroBankPixPaymentGateway(
      logger ?? this.logger,
      this.zrobankPaas,
    );
  }

  getGateway(): PixPaymentGateway {
    return this.gateway;
  }
}
