import { EncryptService, MissingDataException } from '@zro/common';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { ZENVIA_API } from './services.constants';
import {
  SmsGatewayException,
  SmsMessage,
} from '@zro/notifications/application';

enum ZenviaSendSmsCallbackOption {
  ALL = 'ALL',
  FINAL = 'FINAL',
  NONE = 'NONE',
}

interface ZenviaSendSmsRequest {
  from: string;
  to: string;
  schedule?: string;
  msg: string;
  callbackOption: ZenviaSendSmsCallbackOption;
  id: string;
  aggregateId: string;
  flashSms?: boolean;
}

interface ZenviaSendSmsRequestDto {
  sendSmsRequest: ZenviaSendSmsRequest;
}

export class ZenviaSendService {
  constructor(
    private logger: Logger,
    private aggregateId: string,
    private encryptService: EncryptService,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({ context: ZenviaSendService.name });
  }

  /**
   * Remove not allowed data from message before send it to Zenvia.
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
   * Send message via Zenvia.
   * @param message The message.
   * @param logger Request logger.
   */
  async send(message: SmsMessage, logger?: Logger): Promise<void> {
    logger = logger?.child({ context: ZenviaSendService.name }) ?? this.logger;

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

    logger.info('Sending sms via Zenvia', {
      id,
      phoneNumber: message.phoneNumber,
    });

    const payload: ZenviaSendSmsRequestDto = {
      sendSmsRequest: {
        from: 'Zrobank S.A.',
        to: message.phoneNumber,
        msg: message.body,
        aggregateId: this.aggregateId,
        id,
        callbackOption: ZenviaSendSmsCallbackOption.NONE,
        flashSms: false,
      },
    };

    try {
      const response = await this.axios.post(ZENVIA_API.SEND, payload);

      logger.info('Message sent via Zenvia', { response: response.data });
    } catch (error) {
      throw new SmsGatewayException(error);
    }
  }
}
