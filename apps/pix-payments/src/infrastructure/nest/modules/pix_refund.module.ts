import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
  TranslateModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import { JiraModule } from '@zro/jira';
import {
  PixRefundModel,
  ReceivePendingPixRefundNestObserver,
  RevertPixRefundNestObserver,
  CancelPixRefundMicroserviceController,
  CancelPendingPixRefundNestObserver,
  ClosePixRefundMicroserviceController,
  ClosePendingPixRefundNestObserver,
  PixRefundDevolutionModel,
  PendingPixRefundDevolutionNestObserver,
  RevertPixRefundDevolutionNestObserver,
  CompletePixRefundDevolutionNestObserver,
  CreatePixRefundDevolutionNestObserver,
  PixRefundCronServiceInit,
  ReceivePixRefundNestObserver,
} from '@zro/pix-payments/infrastructure';
import {
  AcceptOperationServiceKafka,
  GetWalletAccountByAccountNumberAndCurrencyServiceKafka,
  CreateAndAcceptOperationServiceKafka,
  CreateOperationServiceKafka,
} from '@zro/operations/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    TranslateModule,
    ValidationModule,
    KafkaModule.forFeature([
      AcceptOperationServiceKafka,
      GetWalletAccountByAccountNumberAndCurrencyServiceKafka,
      CreateAndAcceptOperationServiceKafka,
      CreateOperationServiceKafka,
    ]),
    DatabaseModule.forFeature([PixRefundModel, PixRefundDevolutionModel]),
    JdpiPixModule,
    JiraModule,
  ],
  controllers: [
    ReceivePendingPixRefundNestObserver,
    RevertPixRefundNestObserver,
    RevertPixRefundDevolutionNestObserver,
    CancelPixRefundMicroserviceController,
    CancelPendingPixRefundNestObserver,
    ClosePixRefundMicroserviceController,
    ClosePendingPixRefundNestObserver,
    CreatePixRefundDevolutionNestObserver,
    PendingPixRefundDevolutionNestObserver,
    CompletePixRefundDevolutionNestObserver,
    ReceivePixRefundNestObserver,
  ],
  providers: [PixRefundCronServiceInit],
})
export class PixRefundModule {}
