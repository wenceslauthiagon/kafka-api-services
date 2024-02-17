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
  BankAccountModel,
  CashOutSolicitationModel,
  ClientModel,
  CreateCashOutSolicitationMicroserviceController,
  GetAllCashOutSolicitationMicroserviceController,
  PlanModel,
  TransactionModel,
  UserModel,
} from '@zro/pix-zro-pay/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([
      BankAccountModel,
      ClientModel,
      PlanModel,
      UserModel,
      TransactionModel,
      CashOutSolicitationModel,
    ]),
  ],
  controllers: [
    GetAllCashOutSolicitationMicroserviceController,
    CreateCashOutSolicitationMicroserviceController,
  ],
})
export class TransactionModule {}
