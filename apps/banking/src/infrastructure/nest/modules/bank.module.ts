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
  BankModel,
  BankCronServiceInit,
  BankTedCronServiceInit,
  GetAllBankMicroserviceController,
  UpdateBankMicroserviceController,
  GetBankByIspbMicroserviceController,
  GetBankByIdMicroserviceController,
  GetBankTedByCodeMicroserviceController,
  GetAllBankTedMicroserviceController,
  BankTedModel,
  BankingCashInBilletModel,
  BankingPaidBilletModel,
  CardModel,
} from '@zro/banking/infrastructure';
import { JdpiBankModule } from '@zro/jdpi';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([
      BankModel,
      BankTedModel,
      BankingCashInBilletModel,
      BankingPaidBilletModel,
      CardModel,
    ]),
    JdpiBankModule,
  ],
  controllers: [
    GetAllBankMicroserviceController,
    UpdateBankMicroserviceController,
    GetBankByIspbMicroserviceController,
    GetBankByIdMicroserviceController,
    GetBankTedByCodeMicroserviceController,
    GetAllBankTedMicroserviceController,
  ],
  providers: [BankCronServiceInit, BankTedCronServiceInit],
})
export class BankModule {}
