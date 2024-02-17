import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BugReportModule, CacheModule, LoggerModule } from '@zro/common';
import { FeatureSettingModule } from './feature_setting.module';
import { RetryModule } from './retry.module';
import { HealthModule } from './health.module';
import { UserWithdrawSettingModule } from './user_withdraw_setting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.utils.env'] }),
    CacheModule.registerAsync(),
    LoggerModule,
    BugReportModule,
    RetryModule,
    UserWithdrawSettingModule,
    FeatureSettingModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
