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
  GetAllUserWithdrawSettingRestController,
  DeleteUserWithdrawSettingRestController,
} from '@zro/api-users/infrastructure';
import {
  GetAllUserWithdrawSettingServiceKafka,
  DeleteUserWithdrawSettingServiceKafka,
} from '@zro/utils/infrastructure';

/**
 * Utils endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      GetAllUserWithdrawSettingServiceKafka,
      DeleteUserWithdrawSettingServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
    RecaptchaModule,
  ],
  controllers: [
    GetAllUserWithdrawSettingRestController,
    DeleteUserWithdrawSettingRestController,
  ],
})
export class UtilsModule {}
