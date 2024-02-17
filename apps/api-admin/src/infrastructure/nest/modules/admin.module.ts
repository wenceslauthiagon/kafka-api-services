import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, LoggerModule } from '@zro/common';
import {
  GetAdminByEmailServiceKafka,
  UpdateUserPropsRestController,
  UpdateUserPropsServiceKafka,
  SendForgetPasswordRestController,
  ChangeAdminPasswordRestController,
  SendForgetPasswordServiceKafka,
  ChangeAdminPasswordServiceKafka,
  UpdateUserPinHasCreatedRestController,
} from '@zro/api-admin/infrastructure';
import { UpdateUserPinHasCreatedServiceKafka } from '@zro/users/infrastructure';

/**
 * Admin endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([UpdateUserPinHasCreatedServiceKafka]),
  ],
  providers: [
    GetAdminByEmailServiceKafka,
    UpdateUserPropsServiceKafka,
    SendForgetPasswordServiceKafka,
    ChangeAdminPasswordServiceKafka,
  ],
  exports: [GetAdminByEmailServiceKafka],
  controllers: [
    UpdateUserPropsRestController,
    SendForgetPasswordRestController,
    ChangeAdminPasswordRestController,
    UpdateUserPinHasCreatedRestController,
  ],
})
export class AdminModule {}
