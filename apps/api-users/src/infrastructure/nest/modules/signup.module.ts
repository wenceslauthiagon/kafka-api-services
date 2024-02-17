import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  KafkaModule,
  LoggerModule,
  RecaptchaModule,
  ValidationModule,
} from '@zro/common';
import {
  CreateSignupRestController,
  UpdateSignupRestController,
  SendConfirmCodeRestController,
  VerifyConfirmCodeRestController,
  GetSignupByIdRestController,
} from '@zro/api-users/infrastructure';
import {
  CreateSignupServiceKafka,
  GetSignupByIdServiceKafka,
  SendConfirmCodeServiceKafka,
  UpdateSignupServiceKafka,
  VerifyConfirmCodeServiceKafka,
} from '@zro/signup/infrastructure';

/**
 * Signup enpoints module.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      CreateSignupServiceKafka,
      GetSignupByIdServiceKafka,
      SendConfirmCodeServiceKafka,
      UpdateSignupServiceKafka,
      VerifyConfirmCodeServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
    RecaptchaModule,
  ],
  controllers: [
    CreateSignupRestController,
    UpdateSignupRestController,
    SendConfirmCodeRestController,
    VerifyConfirmCodeRestController,
    GetSignupByIdRestController,
  ],
})
export class SignupModule {}
