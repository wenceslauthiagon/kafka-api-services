import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  KafkaModule,
  LoggerModule,
  DatabaseModule,
  ValidationModule,
  TranslateModule,
  RedisModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import {
  PendingNotifyCreditValidationNestObserver,
  ReadyNotifyCreditValidationNestObserver,
  FailedNotifyCreditModel,
  JdpiServiceKafka,
  NotifyCreditDepositJdpiNestObserver,
  NotifyCreditDepositJdpiRestController,
  NotifyCreditDepositModel,
  NotifyCreditDevolutionJdpiNestObserver,
  NotifyCreditDevolutionJdpiRestController,
  NotifyCreditDevolutionModel,
  NotifyCreditValidationGroupJdpiRestController,
  NotifyCreditValidationJdpiRestController,
  NotifyCreditValidationModel,
  FailedNotifyCreditValidationNestObserver,
  NotifyCreditValidationNestObserver,
} from '@zro/api-jdpi/infrastructure';
import {
  GetPaymentByEndToEndIdServiceKafka,
  ReceivePixDepositServiceKafka,
  ReceivePixDevolutionReceivedServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  GetUserByUuidServiceKafka,
  GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka,
} from '@zro/users/infrastructure';

/**
 * Jdpi endpoints module.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka,
      GetUserByUuidServiceKafka,
      ReceivePixDepositServiceKafka,
      ReceivePixDevolutionReceivedServiceKafka,
      GetPaymentByEndToEndIdServiceKafka,
    ]),
    LoggerModule,
    TranslateModule,
    RedisModule,
    DatabaseModule.forFeature([
      NotifyCreditDevolutionModel,
      NotifyCreditDepositModel,
      FailedNotifyCreditModel,
      NotifyCreditValidationModel,
    ]),
    ValidationModule,
    JdpiPixModule,
  ],
  controllers: [
    NotifyCreditValidationJdpiRestController,
    NotifyCreditDepositJdpiRestController,
    NotifyCreditDevolutionJdpiRestController,
    NotifyCreditValidationGroupJdpiRestController,
    NotifyCreditDepositJdpiNestObserver,
    NotifyCreditDevolutionJdpiNestObserver,
    PendingNotifyCreditValidationNestObserver,
    ReadyNotifyCreditValidationNestObserver,
    FailedNotifyCreditValidationNestObserver,
    NotifyCreditValidationNestObserver,
  ],
  providers: [JdpiServiceKafka],
})
export class ApiJdpiModule {}
