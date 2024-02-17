import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  CreateSignupMicroserviceController,
  VerifyConfirmCodeSignupMicroserviceController,
  SendConfirmCodeSignupMicroserviceController,
  SignupModel,
  UpdateSignupMicroserviceController,
  HandleConfirmedSignupNestObserver,
  GetSignupByIdMicroserviceController,
} from '@zro/signup/infrastructure';
import {
  SendSmsServiceKafka,
  SendEmailServiceKafka,
} from '@zro/notifications/infrastructure';
import {
  CreateUserServiceKafka,
  GetUserByEmailServiceKafka,
} from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      SendSmsServiceKafka,
      SendEmailServiceKafka,
      CreateUserServiceKafka,
      GetUserByEmailServiceKafka,
    ]),
    DatabaseModule.forFeature([SignupModel]),
  ],
  controllers: [
    CreateSignupMicroserviceController,
    UpdateSignupMicroserviceController,
    VerifyConfirmCodeSignupMicroserviceController,
    SendConfirmCodeSignupMicroserviceController,
    HandleConfirmedSignupNestObserver,
    GetSignupByIdMicroserviceController,
  ],
})
export class SignupModule {}
