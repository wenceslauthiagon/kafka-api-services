import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import {
  QrCodeDynamicModel,
  CreateQrCodeDynamicInstantBillingMicroserviceController,
  CreateQrCodeDynamicDueDateMicroserviceController,
  GetQrCodeDynamicByIdMicroserviceController,
  PendingQrCodeDynamicNestObserver,
  GetQrCodeDynamicDueDateByIdMicroserviceController,
} from '@zro/pix-payments/infrastructure';
import { GetPixKeyByKeyAndUserServiceKafka } from '@zro/pix-keys/infrastructure';
import { GetUserByUuidServiceKafka } from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetPixKeyByKeyAndUserServiceKafka,
      GetUserByUuidServiceKafka,
    ]),
    DatabaseModule.forFeature([QrCodeDynamicModel]),
    JdpiPixModule,
  ],
  controllers: [
    CreateQrCodeDynamicInstantBillingMicroserviceController,
    CreateQrCodeDynamicDueDateMicroserviceController,
    GetQrCodeDynamicByIdMicroserviceController,
    GetQrCodeDynamicDueDateByIdMicroserviceController,
    PendingQrCodeDynamicNestObserver,
  ],
})
export class QrCodeDynamicModule {}
