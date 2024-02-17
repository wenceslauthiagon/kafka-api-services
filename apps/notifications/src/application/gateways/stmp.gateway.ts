import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Email } from '@zro/notifications/domain';

export type SmtpMessage = Pick<
  Email,
  'to' | 'from' | 'id' | 'title' | 'body' | 'html'
>;

export interface SmtpGateway {
  send(message: SmtpMessage): void | Promise<void>;
}

@Exception(ExceptionTypes.SYSTEM, 'SMTP_GATEWAY')
export class SmtpGatewayException extends DefaultException {
  constructor(error?: Error) {
    super({
      message: 'SMTP gateway',
      type: ExceptionTypes.SYSTEM,
      code: 'SMTP_GATEWAY',
      data: error,
    });
  }
}
