import { EncryptService, MissingDataException } from '@zro/common';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { DOCK_API } from './services.constants';
import {
  SmsGatewayException,
  SmsMessage,
} from '@zro/notifications/application';

export interface DockSendSmsRequest {
  from: string;
  to: string;
  text: string;
}

export class DockSendService {
  constructor(
    private logger: Logger,
    private encryptService: EncryptService,
    private axios: AxiosInstance,
    private from: string,
  ) {
    this.logger = logger.child({ context: DockSendService.name });
  }

  /**
   * Remove not allowed data from message before send it to Dock.
   * @param message The message.
   * @returns Sanitized message.
   */
  private sanitize(message: SmsMessage): SmsMessage {
    return {
      phoneNumber: message.phoneNumber.replace(/[^0-9]/g, ''),
      body: message.body.substring(0, 70),
      id: message.id,
    };
  }

  /**
   * Send message via Dock.
   * @param message The message.
   * @param logger Request logger.
   */
  async send(message: SmsMessage, logger?: Logger): Promise<void> {
    logger = logger?.child({ context: DockSendService.name }) ?? this.logger;

    const { phoneNumber, id } = message;
    let { body } = message;

    if (!phoneNumber || !body || !id) {
      throw new MissingDataException([
        ...(!phoneNumber ? ['phoneNumber'] : []),
        ...(!body ? ['body'] : []),
        ...(!id ? ['id'] : []),
      ]);
    }

    logger.debug('Decrypting message', { id, phoneNumber });

    body = this.encryptService.decrypt(body);

    message = this.sanitize({ id, body, phoneNumber });

    logger.info('Sending sms via Dock', {
      id,
      phoneNumber: message.phoneNumber,
    });

    const request: DockSendSmsRequest = {
      from: this.from,
      to: message.phoneNumber,
      text: message.body,
    };

    try {
      await this.axios.post(DOCK_API.SEND, request);

      logger.info('Message sent via Dock', { id });
    } catch (error) {
      logger.error('Failed to sent via Dock', {
        id,
        response: error?.response?.data,
      });
      throw new SmsGatewayException(error);
    }
  }
}
