import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { PixPaymentGateway } from '@zro/pix-zro-pay/application';
import {
  AsaasGatewayConfig,
  AsaasPixPaymentGateway,
} from '@zro/asaas/infrastructure';
import { AsaasAxiosService } from '@zro/asaas/infrastructure/utils/asaas_axios.util';
import { PaymentGatewayServiceController } from '@zro/pix-zro-pay/infrastructure';

@Injectable()
@PaymentGatewayServiceController()
export class AsaasPixService {
  private readonly basePixPaymentUrl: string;
  private readonly asaasPixPayment: AxiosInstance;

  private readonly gateway: AsaasPixPaymentGateway;

  constructor(
    private readonly configService: ConfigService<AsaasGatewayConfig>,
    private readonly asaasAxios: AsaasAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: AsaasPixService.name });

    this.basePixPaymentUrl = this.configService.get<string>(
      'APP_ASAAS_PIX_PAYMENT_BASE_URL',
    );

    this.asaasPixPayment = this.asaasAxios.create({
      baseURL: this.basePixPaymentUrl,
    });

    this.gateway = new AsaasPixPaymentGateway(
      logger ?? this.logger,
      this.asaasPixPayment,
    );
  }

  getGateway(): Omit<PixPaymentGateway, 'getQrCodeById'> {
    return this.gateway;
  }
}
