import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  CreateUserWithdrawSettingMicroserviceController,
  GetAllUserWithdrawSettingMicroserviceController,
  UserWithdrawSettingCronServiceInit,
  UserWithdrawSettingModel,
  DeleteUserWithdrawSettingMicroserviceController,
} from '@zro/utils/infrastructure';
import {
  GetWalletAccountByUserAndCurrencyServiceKafka,
  GetWalletAccountByWalletAndCurrencyServiceKafka,
} from '@zro/operations/infrastructure';
import { CreateDecodedPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';
import { CreateByPixKeyPaymentServiceKafka } from '@zro/pix-payments/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetWalletAccountByUserAndCurrencyServiceKafka,
      GetWalletAccountByWalletAndCurrencyServiceKafka,
      CreateDecodedPixKeyServiceKafka,
      CreateByPixKeyPaymentServiceKafka,
    ]),
    DatabaseModule.forFeature([UserWithdrawSettingModel]),
  ],
  controllers: [
    CreateUserWithdrawSettingMicroserviceController,
    GetAllUserWithdrawSettingMicroserviceController,
    DeleteUserWithdrawSettingMicroserviceController,
  ],
  providers: [Logger, UserWithdrawSettingCronServiceInit],
})
export class UserWithdrawSettingModule {}
