import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  UserForgotPasswordModel,
  CreateUserForgotPasswordBySmsMicroserviceController,
  CreateUserForgotPasswordByEmailMicroserviceController,
  DeclineUserForgotPasswordMicroserviceController,
  SyncPendingExpiredUserForgotPasswordCronService,
  UpdateUserForgotPasswordMicroserviceController,
} from '@zro/users/infrastructure';
import {
  SendEmailServiceKafka,
  SendSmsServiceKafka,
} from '@zro/notifications/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([SendEmailServiceKafka, SendSmsServiceKafka]),
    DatabaseModule.forFeature([UserForgotPasswordModel]),
  ],
  controllers: [
    CreateUserForgotPasswordByEmailMicroserviceController,
    CreateUserForgotPasswordBySmsMicroserviceController,
    DeclineUserForgotPasswordMicroserviceController,
    UpdateUserForgotPasswordMicroserviceController,
  ],
  providers: [SyncPendingExpiredUserForgotPasswordCronService],
})
export class UserForgotPasswordModule {}
