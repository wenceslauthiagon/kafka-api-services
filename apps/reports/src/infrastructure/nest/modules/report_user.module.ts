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
  CreateReportUserMicroserviceController,
  ReportUserConfigModel,
  ReportUserModel,
  SyncReportsUsersCronServiceInit,
  SyncReportsHoldersCronServiceInit,
  SyncReportsPaymentsAccountHolderCronServiceInit,
} from '@zro/reports/infrastructure';
import { GetAdminByIdServiceKafka } from '@zro/admin/infrastructure';
import { GetUserLimitsByFilterServiceKafka } from '@zro/operations/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetAdminByIdServiceKafka,
      GetUserLimitsByFilterServiceKafka,
    ]),
    DatabaseModule.forFeature([ReportUserModel, ReportUserConfigModel]),
    EguardianModule,
  ],
  controllers: [CreateReportUserMicroserviceController],
  providers: [
    SyncReportsUsersCronServiceInit,
    SyncReportsHoldersCronServiceInit,
    SyncReportsPaymentsAccountHolderCronServiceInit,
  ],
})
export class ReportUserModule {}
