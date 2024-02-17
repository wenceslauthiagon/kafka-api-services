import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { BotOtcModule } from './otc_bot.module';

/**
 * API Otc gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.otc-bot.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    LoggerModule,
    BugReportModule,
    BotOtcModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
