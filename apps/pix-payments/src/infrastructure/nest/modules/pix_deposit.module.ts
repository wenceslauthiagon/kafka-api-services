import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  TranslateModule,
  ValidationModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import {
  PixDepositModel,
  WarningPixDepositModel,
  WarningPixSkipListModel,
  WarningPixBlockListModel,
  WarningPixDepositBankBlockListModel,
  ReceivePixDepositMicroserviceController,
  GetPixDepositByOperationIdMicroserviceController,
  GetAllPixDepositMicroserviceController,
  GetAllPixDepositByWalletMicroserviceController,
  GetAllWarningPixDepositMicroserviceController,
  WaitingPixDepositNestObserver,
  ApprovePixDepositMicroserviceController,
  BlockPixDepositMicroserviceController,
  GetPixDepositByIdMicroserviceController,
  WarningPixDepositIsSantanderCnpjNestObserver,
  WarningPixDepositIsOverWarningIncomeNestObserver,
  WarningPixDepositIsDuplicatedNestObserver,
  WarningPixDepositIsCefNestObserver,
  WarningPixDepositIsReceitaFederalNestObserver,
  WarningPixDepositIsSuspectCpfNestObserver,
  ReceiveFailedPixDepositNestObserver,
  WarningPixDepositIsSuspectBankNestObserver,
  CreatePixInfractionRefundOperationNestObserver,
} from '@zro/pix-payments/infrastructure';
import { GetBankByIspbServiceKafka } from '@zro/banking/infrastructure';
import { GetUserByDocumentServiceKafka } from '@zro/users/infrastructure';
import { CreateWarningTransactionServiceKafka } from '@zro/compliance/infrastructure';
import { GetWalletAccountByWalletAndCurrencyServiceKafka } from '@zro/operations/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetBankByIspbServiceKafka,
      GetUserByDocumentServiceKafka,
      CreateWarningTransactionServiceKafka,
      GetWalletAccountByWalletAndCurrencyServiceKafka,
    ]),
    TranslateModule,
    JdpiPixModule,
    RedisModule,
    DatabaseModule.forFeature([
      PixDepositModel,
      WarningPixDepositModel,
      WarningPixSkipListModel,
      WarningPixBlockListModel,
      WarningPixDepositBankBlockListModel,
    ]),
  ],
  controllers: [
    ReceivePixDepositMicroserviceController,
    GetPixDepositByOperationIdMicroserviceController,
    GetAllPixDepositMicroserviceController,
    GetAllPixDepositByWalletMicroserviceController,
    GetAllWarningPixDepositMicroserviceController,
    WaitingPixDepositNestObserver,
    ApprovePixDepositMicroserviceController,
    BlockPixDepositMicroserviceController,
    GetPixDepositByIdMicroserviceController,
    WarningPixDepositIsSantanderCnpjNestObserver,
    WarningPixDepositIsOverWarningIncomeNestObserver,
    WarningPixDepositIsDuplicatedNestObserver,
    WarningPixDepositIsCefNestObserver,
    WarningPixDepositIsReceitaFederalNestObserver,
    WarningPixDepositIsSuspectCpfNestObserver,
    ReceiveFailedPixDepositNestObserver,
    WarningPixDepositIsSuspectBankNestObserver,
    CreatePixInfractionRefundOperationNestObserver,
  ],
})
export class PixDepositModule {}
