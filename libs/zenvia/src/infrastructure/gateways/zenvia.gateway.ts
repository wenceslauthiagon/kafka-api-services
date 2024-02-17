import { SmsGateway, SmsMessage } from '@zro/notifications/application';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { EncryptService } from '@zro/common';
import { ZenviaSendService } from '@zro/zenvia';

export class ZenviaGateway implements SmsGateway {
  constructor(
    private logger: Logger,
    private aggregateId: string,
    private encryptService: EncryptService,
    private zenviaSevice: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: ZenviaGateway.name,
    });
  }

  /**
   * Send message via Zenvia.
   * @param request The message.
   */
  async send(request: SmsMessage): Promise<void> {
    this.logger.debug('Sending message.', { request });
    const gateway = new ZenviaSendService(
      this.logger,
      this.aggregateId,
      this.encryptService,
      this.zenviaSevice,
    );
    return gateway.send(request);
  }
}
