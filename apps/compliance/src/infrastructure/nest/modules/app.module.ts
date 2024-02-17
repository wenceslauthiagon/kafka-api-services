import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  TranslateModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { UserLimitRequestModule } from './user_limit_request.module';
import { UserWithdrawSettingRequestModule } from './user_withdraw_setting_request.module';
import { WarningTransactionModule } from './warning_transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.compliance.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    LoggerModule,
    BugReportModule,
    TranslateModule,
    WarningTransactionModule,
    UserLimitRequestModule,
    UserWithdrawSettingRequestModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
