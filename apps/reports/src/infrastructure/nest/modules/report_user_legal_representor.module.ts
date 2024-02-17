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
  CreateReportUserLegalRepresentorMicroserviceController,
  ReportUserLegalRepresentorModel,
  SyncReportsUserLegalRepresentorCronServiceInit,
} from '@zro/reports/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([ReportUserLegalRepresentorModel]),
    EguardianModule,
  ],
  controllers: [CreateReportUserLegalRepresentorMicroserviceController],
  providers: [SyncReportsUserLegalRepresentorCronServiceInit],
})
export class ReportUserLegalRepresentorModule {}
