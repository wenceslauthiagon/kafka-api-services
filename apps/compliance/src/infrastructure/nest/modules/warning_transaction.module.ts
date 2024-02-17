import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
  ValidationModule,
} from '@zro/common';
import { JiraModule, JiraComplianceModule } from '@zro/jira';
import {
  CreateWarningTransactionMicroserviceController,
  CloseWarningTransactionMicroserviceController,
  GetWarningTransactionByOperationMicroserviceController,
  ExpiredWarningTransactionNestObserver,
  WarningTransactionModel,
  PendingWarningTransactionNestObserver,
  WarningTransactionCronServiceInit,
} from '@zro/compliance/infrastructure';
import {
  ApprovePixDepositServiceKafka,
  BlockPixDepositServiceKafka,
} from '@zro/pix-payments/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      ApprovePixDepositServiceKafka,
      BlockPixDepositServiceKafka,
    ]),
    JiraModule,
    DatabaseModule.forFeature([WarningTransactionModel]),
    JiraComplianceModule,
    TranslateModule,
  ],
  controllers: [
    PendingWarningTransactionNestObserver,
    CreateWarningTransactionMicroserviceController,
    CloseWarningTransactionMicroserviceController,
    ExpiredWarningTransactionNestObserver,
    GetWarningTransactionByOperationMicroserviceController,
  ],
  providers: [WarningTransactionCronServiceInit],
})
export class WarningTransactionModule {}
