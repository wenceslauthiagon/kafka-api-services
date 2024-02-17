import { EncryptService, MissingDataException } from '@zro/common';
import { v4 as uuidV4 } from 'uuid';
import {
  SmtpGatewayException,
  SmtpMessage,
} from '@zro/notifications/application';
import { Logger } from 'winston';
import { Transporter } from 'nodemailer';

export class MatracaSendService {
  constructor(
    private transporter: Transporter,
    private logger: Logger,
    private encryptService: EncryptService,
    private defaultTitle: string,
  ) {
    this.logger = logger.child({
      context: MatracaSendService.name,
    });
  }
  async send(message: SmtpMessage, logger?: Logger) {
    logger = logger?.child({ context: MatracaSendService.name }) ?? this.logger;

    const { to, from } = message;
    let { id, title, body, html } = message;

    if (!to || !from) {
      throw new MissingDataException([
        ...(!to ? ['to'] : []),
        ...(!from ? ['from'] : []),
      ]);
    }

    // Set a default ID if not provided.
    id = id ?? uuidV4();

    logger.debug('Decrypting message', { id, from, to });
    title = title && this.encryptService.decrypt(title);
    body = body && this.encryptService.decrypt(body);
    html = html && this.encryptService.decrypt(html);

    // Set default title if it is missing.
    title = title ?? this.defaultTitle;

    logger.info('Sending e-mail via Matraca', { id, from, to });

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: title,
        text: body,
        html,
        headers: {
          messageId: id,
        },
      });
    } catch (error) {
      throw new SmtpGatewayException(error);
    }
  }
}
