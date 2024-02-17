import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  BankingContactModel,
  BankingAccountContactModel,
  GetAllBankingContactMicroserviceController,
  DeleteBankingAccountContactMicroserviceController,
} from '@zro/banking/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([
      BankingContactModel,
      BankingAccountContactModel,
    ]),
  ],
  controllers: [
    GetAllBankingContactMicroserviceController,
    DeleteBankingAccountContactMicroserviceController,
  ],
  providers: [],
})
export class BankingContactModule {}
