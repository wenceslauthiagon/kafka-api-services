import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import { EguardianModule } from '@zro/e-guardian';
import {
  ReportUserConfigModel,
  SyncReportsUserConfigsCronServiceInit,
} from '@zro/reports/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([ReportUserConfigModel]),
    EguardianModule,
  ],
  providers: [SyncReportsUserConfigsCronServiceInit],
})
export class ReportUserConfigModule {}
