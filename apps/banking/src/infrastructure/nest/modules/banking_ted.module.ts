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
  BankingTedModel,
  BankingTedReceivedModel,
  BankingTedFailureModel,
  GetBankingTedByIdMicroserviceController,
  GetBankingTedByTransactionIdMicroserviceController,
  GetAllBankingTedMicroserviceController,
  CreateBankingTedMicroserviceController,
  PendingBankingTedNestObserver,
  ConfirmBankingTedMicroserviceController,
  RejectBankingTedMicroserviceController,
  ForwardBankingTedMicroserviceController,
  GetBankingTedReceiptByUserAndOperationMicroserviceController,
  GetBankingTedReceivedByOperationMicroserviceController,
  GetBankingTedByOperationMicroserviceController,
} from '@zro/banking/infrastructure';
import { TopazioBankingModule } from '@zro/topazio';
import {
  GetUserByUuidServiceKafka,
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
  GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka,
} from '@zro/users/infrastructure';
import {
  GetWalletAccountByWalletAndCurrencyServiceKafka,
  CreateAndAcceptOperationServiceKafka,
  RevertOperationServiceKafka,
  GetOperationByIdServiceKafka,
  GetWalletByUserAndDefaultIsTrueServiceKafka,
} from '@zro/operations/infrastructure';
import { GetHolidayByDateServiceKafka } from '@zro/quotations/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetUserByUuidServiceKafka,
      GetOnboardingByUserAndStatusIsFinishedServiceKafka,
      GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka,
      GetHolidayByDateServiceKafka,
      GetWalletByUserAndDefaultIsTrueServiceKafka,
      CreateAndAcceptOperationServiceKafka,
      RevertOperationServiceKafka,
      GetOperationByIdServiceKafka,
      GetWalletAccountByWalletAndCurrencyServiceKafka,
    ]),
    DatabaseModule.forFeature([
      BankingTedModel,
      BankingTedReceivedModel,
      BankingTedFailureModel,
    ]),
    TopazioBankingModule,
  ],
  controllers: [
    GetBankingTedByIdMicroserviceController,
    GetBankingTedByTransactionIdMicroserviceController,
    GetAllBankingTedMicroserviceController,
    CreateBankingTedMicroserviceController,
    PendingBankingTedNestObserver,
    ConfirmBankingTedMicroserviceController,
    RejectBankingTedMicroserviceController,
    ForwardBankingTedMicroserviceController,
    GetBankingTedReceiptByUserAndOperationMicroserviceController,
    GetBankingTedReceivedByOperationMicroserviceController,
    GetBankingTedByOperationMicroserviceController,
  ],
  providers: [],
})
export class BankingTedModule {}
