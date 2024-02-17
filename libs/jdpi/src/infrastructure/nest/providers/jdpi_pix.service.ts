import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, MissingEnvVarException } from '@zro/common';
import { PixStatementGateway } from '@zro/api-jdpi/application';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  PixInfractionGateway,
  PixRefundGateway,
  PixPaymentGateway,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  JdpiGatewayConfig,
  JdpiPixKeyGateway,
  JdpiPixPaymentGateway,
  JdpiPixStatementGateway,
  JdpiPixInfractionGateway,
  JdpiAxiosService,
  JdpiPixRefundGateway,
  JdpiPixFraudDetectionGateway,
} from '@zro/jdpi/infrastructure';

@Injectable()
export class JdpiPixService {
  private readonly jdpiInstance: AxiosInstance;
  private readonly pspIspb: number;
  private readonly pspOpenBankingBaseUrl: string;

  constructor(
    configService: ConfigService<JdpiGatewayConfig>,
    jdpiAxios: JdpiAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: JdpiPixService.name });

    const baseURL = configService.get<string>('APP_JDPI_BASE_URL');

    this.pspIspb = Number(configService.get<number>('APP_ZROBANK_ISPB'));

    this.pspOpenBankingBaseUrl = configService.get<string>(
      'APP_OPEN_BANKING_BASE_URL',
    );

    if (!baseURL || !this.pspIspb || !this.pspOpenBankingBaseUrl) {
      throw new MissingEnvVarException([
        ...(!baseURL ? ['APP_JDPI_BASE_URL'] : []),
        ...(!this.pspIspb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.pspOpenBankingBaseUrl ? ['APP_OPEN_BANKING_BASE_URL'] : []),
      ]);
    }

    this.jdpiInstance = jdpiAxios.create({ baseURL });
  }

  getPixKeyGateway(logger?: Logger): PixKeyGateway {
    return new JdpiPixKeyGateway(logger ?? this.logger, this.jdpiInstance);
  }

  getPixPaymentGateway(logger?: Logger): PixPaymentGateway {
    return new JdpiPixPaymentGateway(
      logger ?? this.logger,
      this.jdpiInstance,
      this.pspIspb,
      this.pspOpenBankingBaseUrl,
    );
  }

  getPixStatementGateway(logger?: Logger): PixStatementGateway {
    return new JdpiPixStatementGateway(
      logger ?? this.logger,
      this.jdpiInstance,
    );
  }

  getPixInfractionGateway(logger?: Logger): PixInfractionGateway {
    return new JdpiPixInfractionGateway(
      logger ?? this.logger,
      this.jdpiInstance,
      this.pspIspb,
    );
  }

  getPixRefundGateway(logger?: Logger): PixRefundGateway {
    return new JdpiPixRefundGateway(
      logger ?? this.logger,
      this.jdpiInstance,
      this.pspIspb,
    );
  }

  getPixFraudDetectionGateway(logger?: Logger): PixFraudDetectionGateway {
    return new JdpiPixFraudDetectionGateway(
      logger ?? this.logger,
      this.jdpiInstance,
      this.pspIspb,
    );
  }
}
