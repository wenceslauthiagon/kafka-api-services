import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RecaptchaModule,
  ValidationModule,
} from '@zro/common';
import {
  GetUserHasPinRestController,
  UpdateUserPinRestController,
  AddUserPinRestController,
  ChangeUserPinNestObserver,
  ChangeUserPasswordNestObserver,
} from '@zro/api-users/infrastructure';
import {
  AddUserPinServiceKafka,
  GetUserHasPinServiceKafka,
  UpdateUserPinServiceKafka,
} from '@zro/users/infrastructure';

/**
 * User endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      AddUserPinServiceKafka,
      GetUserHasPinServiceKafka,
      UpdateUserPinServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
    RecaptchaModule,
    DatabaseModule.forFeature([]),
  ],
  controllers: [
    GetUserHasPinRestController,
    UpdateUserPinRestController,
    AddUserPinRestController,
    ChangeUserPinNestObserver,
    ChangeUserPasswordNestObserver,
  ],
})
export class UserModule {}
