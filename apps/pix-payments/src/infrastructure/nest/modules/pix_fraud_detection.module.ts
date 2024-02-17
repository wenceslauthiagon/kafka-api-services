import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
  ValidationModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import { JiraModule } from '@zro/jira';
import {
  PixFraudDetectionModel,
  RegisterPixFraudDetectionMicroserviceController,
  CancelPixFraudDetectionRegisteredMicroserviceController,
  PixFraudDetectionDeadLetterFraudDetectionNestObserver,
  RegisterPendingPixFraudDetectionNestObserver,
  CancelPendingPixFraudDetectionRegisteredNestObserver,
  ReceivePixFraudDetectionNestObserver,
  ReceivePendingPixFraudDetectionNestObserver,
  CancelPixFraudDetectionReceivedNestObserver,
  PixFraudDetectionCronServiceInit,
  CancelPendingPixFraudDetectionReceivedNestObserver,
} from '@zro/pix-payments/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([PixFraudDetectionModel]),
    JdpiPixModule,
    TranslateModule,
    JiraModule,
  ],
  controllers: [
    RegisterPixFraudDetectionMicroserviceController,
    CancelPixFraudDetectionRegisteredMicroserviceController,
    ReceivePixFraudDetectionNestObserver,
    ReceivePendingPixFraudDetectionNestObserver,
    PixFraudDetectionDeadLetterFraudDetectionNestObserver,
    RegisterPendingPixFraudDetectionNestObserver,
    CancelPendingPixFraudDetectionRegisteredNestObserver,
    CancelPixFraudDetectionReceivedNestObserver,
    CancelPendingPixFraudDetectionReceivedNestObserver,
  ],
  providers: [PixFraudDetectionCronServiceInit],
})
export class PixFraudDetectionModule {}
