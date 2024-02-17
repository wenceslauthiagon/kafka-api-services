import { SmtpGateway, SmtpMessage } from '@zro/notifications/application';
import { Transporter } from 'nodemailer';
import { Logger } from 'winston';
import { EncryptService } from '@zro/common';
import { MatracaSendService } from '@zro/matraca/infrastructure/providers/send.service';

export class MatracaGateway implements SmtpGateway {
  constructor(
    private transporter: Transporter,
    private logger: Logger,
    private encryptService: EncryptService,
    private defaultTitle: string,
  ) {
    this.logger = logger.child({
      context: MatracaGateway.name,
    });
  }

  async send(message: SmtpMessage, logger?: Logger): Promise<void> {
    const gateway = new MatracaSendService(
      this.transporter,
      this.logger,
      this.encryptService,
      this.defaultTitle,
    );
    return gateway.send(message, logger);
  }
}
