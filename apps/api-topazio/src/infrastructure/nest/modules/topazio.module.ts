import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  KafkaModule,
  LoggerModule,
  DatabaseModule,
  ValidationModule,
  RedisModule,
  TranslateModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import {
  NotifyClaimsRestController,
  NotifyCompletionRestController,
  NotifyDebitRestController,
  NotifyCreditRestController,
  PixKeyServiceKafkaInit,
  NotifyClaimModel,
  TopazioServiceKafka,
  NotifyDebitModel,
  NotifyCreditModel,
  NotifyCompletionModel,
  NotifyInfractionModel,
  NotifyRefundModel,
  NotifyRegisterBankingTedModel,
  NotifyRegisterBankingTedRestController,
  NotifyConfirmBankingTedRestController,
  NotifyRegisterBankingTedTopazioNestObserver,
  NotifyConfirmBankingTedTopazioNestObserver,
  NotifyConfirmBankingTedModel,
  FailedNotifyCreditModel,
} from '@zro/api-topazio/infrastructure';
import {
  GetAdminBankingTedByTransactionIdServiceKafka,
  ForwardAdminBankingTedServiceKafka,
  RejectAdminBankingTedServiceKafka,
  GetBankingTedByTransactionIdServiceKafka,
  ConfirmBankingTedServiceKafka,
  ForwardBankingTedServiceKafka,
  RejectBankingTedServiceKafka,
} from '@zro/banking/infrastructure';
import {
  GetPaymentByIdServiceKafka,
  ReceivePixDepositServiceKafka,
  GetPixDevolutionByIdServiceKafka,
  ReceivePixDevolutionReceivedServiceKafka,
  ReceivePaymentChargebackServiceKafka,
  ReceivePixDevolutionChargebackServiceKafka,
} from '@zro/pix-payments/infrastructure';

/**
 * Topazio endpoints module.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    KafkaModule.forFeature([
      GetAdminBankingTedByTransactionIdServiceKafka,
      ForwardAdminBankingTedServiceKafka,
      RejectAdminBankingTedServiceKafka,
      GetBankingTedByTransactionIdServiceKafka,
      ConfirmBankingTedServiceKafka,
      ForwardBankingTedServiceKafka,
      RejectBankingTedServiceKafka,
      GetPaymentByIdServiceKafka,
      ReceivePixDepositServiceKafka,
      GetPixDevolutionByIdServiceKafka,
      ReceivePixDevolutionReceivedServiceKafka,
      ReceivePaymentChargebackServiceKafka,
      ReceivePixDevolutionChargebackServiceKafka,
    ]),
    RedisModule,
    LoggerModule,
    TranslateModule,
    DatabaseModule.forFeature([
      NotifyClaimModel,
      NotifyDebitModel,
      NotifyCreditModel,
      NotifyCompletionModel,
      NotifyInfractionModel,
      NotifyRefundModel,
      NotifyRegisterBankingTedModel,
      NotifyConfirmBankingTedModel,
      FailedNotifyCreditModel,
    ]),
    ValidationModule,
    JdpiPixModule,
  ],
  controllers: [
    NotifyClaimsRestController,
    NotifyCompletionRestController,
    NotifyDebitRestController,
    NotifyCreditRestController,
    NotifyRegisterBankingTedRestController,
    NotifyConfirmBankingTedRestController,
    NotifyRegisterBankingTedTopazioNestObserver,
    NotifyConfirmBankingTedTopazioNestObserver,
  ],
  providers: [TopazioServiceKafka, PixKeyServiceKafkaInit],
})
export class ApiTopazioModule {}
