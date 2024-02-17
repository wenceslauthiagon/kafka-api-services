import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  EncryptModule,
  KafkaModule,
  LoggerModule,
} from '@zro/common';
import { AxiosWebhookTargetGatewayModule } from '@zro/gateway-webhook';
import {
  WebhookEventModel,
  WebhookEventNestObserver,
  WebhookModel,
  WebhooksNestObserver,
} from '@zro/webhooks/infrastructure';
import { RetryPushServiceKafka } from '@zro/utils/infrastructure';
import {
  GetPaymentByIdServiceKafka,
  GetPixDepositByIdServiceKafka,
  GetPixDevolutionByIdServiceKafka,
  GetPixDevolutionReceivedByIdServiceKafka,
} from '@zro/pix-payments/infrastructure';
import { GetBankByIdServiceKafka } from '@zro/banking/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      RetryPushServiceKafka,
      GetPaymentByIdServiceKafka,
      GetPixDepositByIdServiceKafka,
      GetPixDevolutionByIdServiceKafka,
      GetPixDevolutionReceivedByIdServiceKafka,
      GetBankByIdServiceKafka,
    ]),
    DatabaseModule.forFeature([WebhookModel, WebhookEventModel]),
    EncryptModule,
    AxiosWebhookTargetGatewayModule,
  ],
  controllers: [WebhooksNestObserver, WebhookEventNestObserver],
})
export class WebhookModule {}
