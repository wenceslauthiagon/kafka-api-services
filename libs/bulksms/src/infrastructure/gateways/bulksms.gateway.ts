import { SmsGateway, SmsMessage } from '@zro/notifications/application';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { EncryptService } from '@zro/common';
import { BulksmsSendService } from '@zro/bulksms';

export class BulksmsGateway implements SmsGateway {
  constructor(
    private logger: Logger,
    private encryptService: EncryptService,
    private bulksmsSevice: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: BulksmsGateway.name,
    });
  }

  /**
   * Send message via Bulksms.
   * @param request The message.
   */
  async send(request: SmsMessage): Promise<void> {
    this.logger.debug('Sending message.', { request });
    const gateway = new BulksmsSendService(
      this.logger,
      this.encryptService,
      this.bulksmsSevice,
    );
    return gateway.send(request);
  }
}
