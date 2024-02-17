import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { PixPaymentGateway } from '@zro/pix-zro-pay/application';
import {
  GenialGatewayConfig,
  GenialPixPaymentGateway,
} from '@zro/genial/infrastructure';
import { GenialAxiosService } from '@zro/genial/infrastructure/utils/genial_axios.util';
import { PaymentGatewayServiceController } from '@zro/pix-zro-pay/infrastructure';

@Injectable()
@PaymentGatewayServiceController()
export class GenialPixService {
  private readonly basePixPaymentUrl: string;
  private readonly genialPixPayment: AxiosInstance;
  private readonly qrCodeAccountHolderName: string;
  private readonly qrCodeAccountHolderCity: string;
  private readonly qrCodeCpnjZro: string;

  private readonly gateway: GenialPixPaymentGateway;

  constructor(
    private readonly configService: ConfigService<GenialGatewayConfig>,
    private readonly genialAxios: GenialAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: GenialPixService.name });

    this.basePixPaymentUrl = this.configService.get<string>(
      'APP_GENIAL_PIX_PAYMENT_BASE_URL',
    );

    this.qrCodeAccountHolderName = this.configService.get<string>(
      'APP_GENIAL_QR_CODE_ACCOUNT_HOLDER_NAME',
    );

    this.qrCodeAccountHolderCity = this.configService.get<string>(
      'APP_GENIAL_QR_CODE_ACCOUNT_HOLDER_CITY',
    );

    this.qrCodeCpnjZro = this.configService.get<string>(
      'APP_GENIAL_QR_CODE_CNPJ_ZRO',
    );

    this.genialPixPayment = this.genialAxios.create({
      baseURL: this.basePixPaymentUrl,
    });

    this.gateway = new GenialPixPaymentGateway(
      logger ?? this.logger,
      this.genialPixPayment,
      this.qrCodeAccountHolderName,
      this.qrCodeAccountHolderCity,
      this.qrCodeCpnjZro,
    );
  }

  getGateway(): Omit<PixPaymentGateway, 'getQrCodeById'> {
    return this.gateway;
  }
}
