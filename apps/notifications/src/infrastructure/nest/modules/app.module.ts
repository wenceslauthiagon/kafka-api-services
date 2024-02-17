import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
} from '@zro/common';
import { EmailModule } from './email.module';
import { SmsModule } from './sms.module';
import { HealthModule } from './health.module';
import { BellNotificationModule } from './bell_notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.notifications.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    LoggerModule,
    BugReportModule,
    EmailModule,
    SmsModule,
    BellNotificationModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
