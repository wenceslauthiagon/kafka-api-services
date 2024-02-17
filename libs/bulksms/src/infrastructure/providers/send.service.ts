import { EncryptService, MissingDataException } from '@zro/common';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { BULKSMS_API } from './services.constants';
import {
  SmsGatewayException,
  SmsMessage,
} from '@zro/notifications/application';

export enum BulksmsSendSmsCallbackOption {
  ALL = 'ALL',
  FINAL = 'FINAL',
  NONE = 'NONE',
}

export interface BulksmsSendSmsRequest {
  to: string;
  body: string;
}

export interface BulksmsSendSmsResponse {
  id: string;
  type: string;
  to: string;
  body: string;
  status: {
    id: string;
    type: string;
    subtype: string;
  };
}

export class BulksmsSendService {
  constructor(
    private logger: Logger,
    private encryptService: EncryptService,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({ context: BulksmsSendService.name });
  }

  /**
   * Remove not allowed data from message before send it to Bulksms.
   * @param message The message.
   * @returns Sanitized message.
   */
  private sanitize(message: SmsMessage): SmsMessage {
    return {
      phoneNumber: `+${message.phoneNumber.replace(/[^0-9]/g, '')}`,
      body: message.body.substring(0, 70),
      id: message.id,
    };
  }

  /**
   * Send message via Bulksms.
   * @param message The message.
   * @param logger Request logger.
   */
  async send(message: SmsMessage, logger?: Logger): Promise<void> {
    logger = logger?.child({ context: BulksmsSendService.name }) ?? this.logger;

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

    logger.info('Sending sms via Bulksms', {
      id,
      phoneNumber: message.phoneNumber,
    });

    const request: BulksmsSendSmsRequest = {
      to: message.phoneNumber,
      body: message.body,
    };

    let response = null;

    try {
      response = await this.axios.post(BULKSMS_API.SEND, request);

      logger.info('Message sent via Bulksms', { id });
    } catch (error) {
      logger.error('Failed to sent via Bulksms', {
        id,
        response: error?.response?.data,
      });
      throw new SmsGatewayException(error);
    }

    if (response?.data?.status?.type === 'FAILED') {
      logger.error('Failed to sent via Bulksms', {
        id,
        response: response?.data?.status,
      });
      throw new SmsGatewayException(response?.data?.status);
    }
  }
}
