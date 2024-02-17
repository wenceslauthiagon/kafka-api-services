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
import { JiraModule } from '@zro/jira';
import { JdpiPixModule } from '@zro/jdpi';
import {
  WarningPixDevolutionModel,
  CreateWarningPixDevolutionMicroserviceController,
  CreateWarningPixDevolutionNestObserver,
  PendingWarningPixDevolutionNestObserver,
  RevertWarningPixDevolutionNestObserver,
  CompleteWarningPixDevolutionNestObserver,
  WarningPixDevolutionCronServiceInit,
  GetByWarningPixDevolutionMicroserviceIdRestController,
} from '@zro/pix-payments/infrastructure';
import {
  RevertOperationServiceKafka,
  GetOperationByIdServiceKafka,
} from '@zro/operations/infrastructure';
import { GetWarningTransactionByOperationServiceKafka } from '@zro/compliance/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    TranslateModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetOperationByIdServiceKafka,
      RevertOperationServiceKafka,
      GetWarningTransactionByOperationServiceKafka,
    ]),
    DatabaseModule.forFeature([WarningPixDevolutionModel]),
    JiraModule,
    JdpiPixModule,
  ],
  controllers: [
    CreateWarningPixDevolutionMicroserviceController,
    CreateWarningPixDevolutionNestObserver,
    PendingWarningPixDevolutionNestObserver,
    RevertWarningPixDevolutionNestObserver,
    CompleteWarningPixDevolutionNestObserver,
    GetByWarningPixDevolutionMicroserviceIdRestController,
  ],
  providers: [WarningPixDevolutionCronServiceInit],
})
export class WarningPixDevolutionModule {}
