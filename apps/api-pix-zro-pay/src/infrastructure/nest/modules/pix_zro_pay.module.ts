import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  KafkaModule,
  ValidationModule,
  TranslateModule,
  LoggerModule,
} from '@zro/common';
import {
  CreateQrCodeRestController,
  CreateCashOutSolicitationRestController,
  GetAllCashOutSolicitationRestController,
  UploadCashOutSolicitationFileRestController,
  DeleteCashOutSolicitationRestController,
  DownloadCashOutSolicitationRestController,
  GetAllFilesCashOutSolicitationRestController,
  GetFileByIdCashoutSolicitationRestController,
} from '@zro/api-pix-zro-pay/infrastructure';
import {
  CreateCashOutSolicitationServiceKafka,
  CreateQrCodeServiceKafka,
  GetAllCashOutSolicitationServiceKafka,
} from '@zro/pix-zro-pay/infrastructure';

/**
 * PixZroPay endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      CreateQrCodeServiceKafka,
      CreateCashOutSolicitationServiceKafka,
      GetAllCashOutSolicitationServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
    TranslateModule,
  ],
  controllers: [
    CreateQrCodeRestController,
    GetAllCashOutSolicitationRestController,
    CreateCashOutSolicitationRestController,
    UploadCashOutSolicitationFileRestController,
    DownloadCashOutSolicitationRestController,
    DeleteCashOutSolicitationRestController,
    GetAllFilesCashOutSolicitationRestController,
    GetFileByIdCashoutSolicitationRestController,
  ],
})
export class PixZroPayModule {}
