import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger } from '@zro/common';
import { WebhookTargetGateway } from '@zro/webhooks/application';
import { AxiosWebhookTargetGateway } from '@zro/gateway-webhook';

@Injectable()
export class AxiosWebhookTargetGatewayService {
  constructor(@InjectLogger() private readonly logger: Logger) {
    this.logger = logger.child({
      context: AxiosWebhookTargetGatewayService.name,
    });
  }

  getWebhookTargetGateway(logger?: Logger): WebhookTargetGateway {
    return new AxiosWebhookTargetGateway(logger ?? this.logger);
  }
}
