import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
  ValidationModule,
} from '@zro/common';
import { JiraModule, JiraComplianceModule } from '@zro/jira';
import {
  CloseUserLimitRequestMicroserviceController,
  CreateUserLimitRequestMicroserviceController,
  HandleOpenPendingUserLimitRequestNestObserver,
  UserLimitRequestModel,
  UserLimitRequestStateChangeNotificationNestObserver,
} from '@zro/compliance/infrastructure';
import { CreateBellNotificationServiceKafka } from '@zro/notifications/infrastructure';
import { GetUserByUuidServiceKafka } from '@zro/users/infrastructure';
import { GetUserLimitByIdAndUserServiceKafka } from '@zro/operations/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      CreateBellNotificationServiceKafka,
      GetUserByUuidServiceKafka,
      GetUserLimitByIdAndUserServiceKafka,
    ]),
    JiraModule,
    DatabaseModule.forFeature([UserLimitRequestModel]),
    JiraComplianceModule,
    TranslateModule,
  ],
  controllers: [
    CreateUserLimitRequestMicroserviceController,
    HandleOpenPendingUserLimitRequestNestObserver,
    CloseUserLimitRequestMicroserviceController,
    UserLimitRequestStateChangeNotificationNestObserver,
  ],
})
export class UserLimitRequestModule {}
