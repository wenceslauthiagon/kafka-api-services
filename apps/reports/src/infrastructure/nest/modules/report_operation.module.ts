import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import { EguardianModule } from '@zro/e-guardian';
import {
  ReportOperationModel,
  CreateReportOperationByGatewayMicroserviceController,
  ReportPixDepositNestObserver,
  ReportPixDevolutionReceivedNestObserver,
  ReportPixDevolutionNestObserver,
  ReportPixPaymentNestObserver,
  SyncCardOperationCronServiceInit,
  SyncTedOperationCronServiceInit,
  SyncBankBilletOperationCronServiceInit,
  CreateReportOperationMicroserviceController,
  SyncReportsOperationsCronServiceInit,
} from '@zro/reports/infrastructure';
import { GetUserByDocumentServiceKafka } from '@zro/users/infrastructure';
import {
  GetActiveTransactionTypeByTagServiceKafka,
  GetAllOperationsByFilterServiceKafka,
  GetWalletAccountByUserAndCurrencyServiceKafka,
  GetOperationByIdServiceKafka,
  GetCurrencyByTagServiceKafka,
} from '@zro/operations/infrastructure';
import {
  GetBankingTedByOperationServiceKafka,
  GetBankingTedReceivedByOperationServiceKafka,
} from '@zro/banking/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetUserByDocumentServiceKafka,
      GetActiveTransactionTypeByTagServiceKafka,
      GetBankingTedByOperationServiceKafka,
      GetBankingTedReceivedByOperationServiceKafka,
      GetAllOperationsByFilterServiceKafka,
      GetWalletAccountByUserAndCurrencyServiceKafka,
      GetOperationByIdServiceKafka,
      GetCurrencyByTagServiceKafka,
    ]),
    DatabaseModule.forFeature([ReportOperationModel]),
    EguardianModule,
  ],
  controllers: [
    CreateReportOperationByGatewayMicroserviceController,
    ReportPixDepositNestObserver,
    ReportPixDevolutionReceivedNestObserver,
    ReportPixDevolutionNestObserver,
    ReportPixPaymentNestObserver,
    CreateReportOperationMicroserviceController,
  ],
  providers: [
    SyncCardOperationCronServiceInit,
    SyncTedOperationCronServiceInit,
    SyncBankBilletOperationCronServiceInit,
    SyncReportsOperationsCronServiceInit,
  ],
})
export class ReportOperationModule {}
