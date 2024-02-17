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
  QrCodeStaticModel,
  GetAllQrCodeStaticByUserMicroserviceController,
  GetByQrCodeStaticIdMicroserviceController,
  CreateQrCodeStaticMicroserviceController,
  DeleteByQrCodeStaticIdMicroserviceController,
  PendingQrCodeStaticNestObserver,
  DeletingQrCodeStaticNestObserver,
  CanceledPixKeyQrCodeStaticNestObserver,
} from '@zro/pix-payments/infrastructure';
import { GetPixKeyByIdServiceKafka } from '@zro/pix-keys/infrastructure';
import {
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
  GetAddressByIdServiceKafka,
} from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetPixKeyByIdServiceKafka,
      GetOnboardingByUserAndStatusIsFinishedServiceKafka,
      GetAddressByIdServiceKafka,
    ]),
    DatabaseModule.forFeature([QrCodeStaticModel]),
    JdpiPixModule,
  ],
  controllers: [
    GetAllQrCodeStaticByUserMicroserviceController,
    GetByQrCodeStaticIdMicroserviceController,
    CreateQrCodeStaticMicroserviceController,
    DeleteByQrCodeStaticIdMicroserviceController,
    PendingQrCodeStaticNestObserver,
    DeletingQrCodeStaticNestObserver,
    CanceledPixKeyQrCodeStaticNestObserver,
  ],
})
export class QrCodeStaticModule {}
