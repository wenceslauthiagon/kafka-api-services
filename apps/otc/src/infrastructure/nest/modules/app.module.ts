import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
} from '@zro/common';
import { OtcModule } from './otc.module';
import { HealthModule } from './health.module';

/**
 * API Otc gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.otc.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    LoggerModule,
    BugReportModule,
    OtcModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
