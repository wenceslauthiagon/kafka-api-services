import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { EncryptService, InjectLogger } from '@zro/common';
import { MatracaGatewayConfig } from '../config/matraca.config';
import { MatracaGateway } from '../nest/gateways/matraca.gateway';

@Injectable()
export class MatracaService {
  private readonly defaultTitle: string;
  private readonly transporter: Transporter;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<MatracaGatewayConfig>,
    private readonly encryptService: EncryptService,
  ) {
    this.logger = logger.child({ context: MatracaService.name });
    this.transporter = createTransport({
      host: this.configService.get<string>('APP_MATRACA_HOST'),
      port: this.configService.get<number>('APP_MATRACA_PORT', 25),
    });
    this.defaultTitle = this.configService.get('APP_MATRACA_DEFAULT_SUBJECT');
  }

  getMatracaGateway(logger?: Logger): MatracaGateway {
    return new MatracaGateway(
      this.transporter,
      logger ?? this.logger,
      this.encryptService,
      this.defaultTitle,
    );
  }
}
