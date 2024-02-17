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
import {
  PixDevolutionModel,
  PixDevolutionCronServiceInit,
  CreatePixDevolutionMicroserviceController,
  GetPixDevolutionByIdMicroserviceController,
  ReceivePixDevolutionChargebackMicroserviceController,
  PendingPixDevolutionNestObserver,
  RevertPixDevolutionNestObserver,
  CompletePixDevolutionNestObserver,
  GetPixDevolutionByOperationIdMicroserviceController,
  GetAllPixDevolutionMicroserviceController,
  GetAllPixDevolutionByWalletMicroserviceController,
  CreateFailedPixDevolutionNestObserver,
  PendingFailedPixDevolutionNestObserver,
  PixRefundDevolutionCronServiceInit,
} from '@zro/pix-payments/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    TranslateModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([PixDevolutionModel]),
    JdpiPixModule,
  ],
  controllers: [
    CreatePixDevolutionMicroserviceController,
    GetPixDevolutionByIdMicroserviceController,
    ReceivePixDevolutionChargebackMicroserviceController,
    PendingPixDevolutionNestObserver,
    RevertPixDevolutionNestObserver,
    CompletePixDevolutionNestObserver,
    GetPixDevolutionByOperationIdMicroserviceController,
    GetAllPixDevolutionMicroserviceController,
    GetAllPixDevolutionByWalletMicroserviceController,
    CreateFailedPixDevolutionNestObserver,
    PendingFailedPixDevolutionNestObserver,
  ],
  providers: [PixDevolutionCronServiceInit, PixRefundDevolutionCronServiceInit],
})
export class PixDevolutionModule {}
