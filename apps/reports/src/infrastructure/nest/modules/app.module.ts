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
import { ReportOperationModule } from './report_operation.module';
import { ReportUserModule } from './report_user.module';
import { ReportUserLegalRepresentorModule } from './report_user_legal_representor.module';
import { ReportUserConfigModule } from './report_user_config.module';

/**
 * API Reports gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.reports.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    LoggerModule,
    BugReportModule,
    ReportOperationModule,
    ReportUserModule,
    ReportUserLegalRepresentorModule,
    ReportUserConfigModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
