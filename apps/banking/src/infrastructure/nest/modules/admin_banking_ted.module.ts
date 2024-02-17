import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  AdminBankingTedModel,
  AdminBankingAccountModel,
  GetAdminBankingTedByIdMicroserviceController,
  GetAdminBankingTedByTransactionIdMicroserviceController,
  CreateAdminBankingTedMicroserviceController,
  PendingAdminBankingTedNestObserver,
  RejectAdminBankingTedMicroserviceController,
  ForwardAdminBankingTedMicroserviceController,
  GetAllAdminBankingTedMicroserviceController,
} from '@zro/banking/infrastructure';
import { TopazioBankingModule } from '@zro/topazio';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([AdminBankingTedModel, AdminBankingAccountModel]),
    TopazioBankingModule,
  ],
  controllers: [
    GetAllAdminBankingTedMicroserviceController,
    GetAdminBankingTedByIdMicroserviceController,
    GetAdminBankingTedByTransactionIdMicroserviceController,
    CreateAdminBankingTedMicroserviceController,
    PendingAdminBankingTedNestObserver,
    RejectAdminBankingTedMicroserviceController,
    ForwardAdminBankingTedMicroserviceController,
  ],
  providers: [],
})
export class AdminBankingTedModule {}
