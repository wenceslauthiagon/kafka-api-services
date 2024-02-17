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
  GetPixInfractionByPspIdMicroserviceController,
  PixInfractionModel,
  ReceivePendingPixInfractionNestObserver,
  RevertPixInfractionNestObserver,
  PixRefundModel,
  CreatePixInfractionMicroserviceController,
  OpenPixInfractionMicroserviceController,
  OpenPendingPixInfractionNestObserver,
  CancelPixInfractionMicroserviceController,
  CancelPendingPixInfractionNestObserver,
  InAnalysisPixInfractionMicroserviceController,
  ClosePixInfractionMicroserviceController,
  ClosePendingPixInfractionNestObserver,
  AcknowledgePendingPixInfractionNestObserver,
  ClosePendingPixInfractionReceivedNestObserver,
  CancelPendingPixInfractionReceivedNestObserver,
  PixInfractionRefundOperationModel,
  PixInfractionCronServiceInit,
  ReceivePixInfractionNestObserver,
  AcknowledgePixInfractionNestObserver,
  ClosePixInfractionReceivedNestObserver,
  CancelPixInfractionReceivedNestObserver,
} from '@zro/pix-payments/infrastructure';
import { GetWalletByUserAndDefaultIsTrueServiceKafka } from '@zro/operations/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([GetWalletByUserAndDefaultIsTrueServiceKafka]),
    DatabaseModule.forFeature([
      PixInfractionModel,
      PixRefundModel,
      PixInfractionRefundOperationModel,
    ]),
    JdpiPixModule,
    TranslateModule,
    JiraModule,
  ],
  controllers: [
    GetPixInfractionByPspIdMicroserviceController,
    ReceivePendingPixInfractionNestObserver,
    RevertPixInfractionNestObserver,
    CreatePixInfractionMicroserviceController,
    OpenPixInfractionMicroserviceController,
    OpenPendingPixInfractionNestObserver,
    CancelPixInfractionMicroserviceController,
    CancelPendingPixInfractionNestObserver,
    InAnalysisPixInfractionMicroserviceController,
    ClosePixInfractionMicroserviceController,
    ClosePendingPixInfractionNestObserver,
    AcknowledgePendingPixInfractionNestObserver,
    ClosePendingPixInfractionReceivedNestObserver,
    CancelPendingPixInfractionReceivedNestObserver,
    ReceivePixInfractionNestObserver,
    AcknowledgePixInfractionNestObserver,
    ClosePixInfractionReceivedNestObserver,
    CancelPixInfractionReceivedNestObserver,
  ],
  providers: [PixInfractionCronServiceInit],
})
export class PixInfractionModule {}
