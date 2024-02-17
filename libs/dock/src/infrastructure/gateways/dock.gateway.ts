import { SmsGateway, SmsMessage } from '@zro/notifications/application';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { EncryptService } from '@zro/common';
import { DockSendService } from '@zro/dock/infrastructure';

export class DockSmsGateway implements SmsGateway {
  constructor(
    private logger: Logger,
    private encryptService: EncryptService,
    private dockSmsAxios: AxiosInstance,
    private from: string,
  ) {
    this.logger = logger.child({
      context: DockSmsGateway.name,
    });
  }

  /**
   * Send message via Dock.
   * @param request The message.
   */
  async send(request: SmsMessage): Promise<void> {
    this.logger.debug('Sending message.', { request });
    const gateway = new DockSendService(
      this.logger,
      this.encryptService,
      this.dockSmsAxios,
      this.from,
    );
    return gateway.send(request);
  }
}
