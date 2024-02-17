import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { WebhookModule } from './webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.webhooks.env'],
    }),
    CacheModule.registerAsync(),
    KafkaModule,
    LoggerModule,
    BugReportModule,
    WebhookModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
