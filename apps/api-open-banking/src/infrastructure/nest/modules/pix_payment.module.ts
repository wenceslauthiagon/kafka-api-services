import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, ValidationModule, LoggerModule } from '@zro/common';
import {
  GetQrCodeDynamicByIdRestController,
  GetQrCodeDynamicDueDateByIdRestController,
  GetJwksFileRestController,
} from '@zro/api-open-banking/infrastructure';
import {
  GetQrCodeDynamicByIdServiceKafka,
  GetQrCodeDynamicDueDateByIdServiceKafka,
} from '@zro/pix-payments/infrastructure';

/**
 * PixPayment endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      GetQrCodeDynamicByIdServiceKafka,
      GetQrCodeDynamicDueDateByIdServiceKafka,
    ]),
    ValidationModule,
  ],
  controllers: [
    GetQrCodeDynamicByIdRestController,
    GetQrCodeDynamicDueDateByIdRestController,
    GetJwksFileRestController,
  ],
})
export class PixPaymentModule {}
