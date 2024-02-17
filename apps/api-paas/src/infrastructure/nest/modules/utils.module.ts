import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  DeleteUserWithdrawSettingRestController,
  GetAllUserWithdrawSettingRestController,
} from '@zro/api-paas/infrastructure';
import {
  DeleteUserWithdrawSettingServiceKafka,
  GetAllUserWithdrawSettingServiceKafka,
} from '@zro/utils/infrastructure';

/**
 * Utils endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      GetAllUserWithdrawSettingServiceKafka,
      DeleteUserWithdrawSettingServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    GetAllUserWithdrawSettingRestController,
    DeleteUserWithdrawSettingRestController,
  ],
})
export class UtilsModule {}
