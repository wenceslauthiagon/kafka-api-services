import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AxiosWebhookTargetGatewayService } from '../providers/axios_webhook_target_gateway.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [AxiosWebhookTargetGatewayService],
  exports: [AxiosWebhookTargetGatewayService],
})
export class AxiosWebhookTargetGatewayModule {}
