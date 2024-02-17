import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Sms } from '@zro/notifications/domain';

export type SmsMessage = Pick<Sms, 'phoneNumber' | 'id' | 'body'>;

export interface SmsGateway {
  send(message: SmsMessage): void | Promise<void>;
}

@Exception(ExceptionTypes.SYSTEM, 'SMS_GATEWAY')
export class SmsGatewayException extends DefaultException {
  constructor(error?: any) {
    super({
      message: 'SMS gateway',
      type: ExceptionTypes.SYSTEM,
      code: 'SMS_GATEWAY',
      data: error?.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            config: error.response.config,
            data: error.response.data,
          }
        : error,
    });
  }
}
