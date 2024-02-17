import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  CreateRefundController,
  CreatePaymentController,
  CreatePreCheckoutController,
  GetPaymentStatusController,
} from '@zro/api-paas/infrastructure';
import {
  CreatePaymentPicPayServiceKafka,
  CreatePreCheckoutPicPayServiceKafka,
  CreateRefundPicPayServiceKafka,
} from '@zro/picpay/infrastructure';

/**
 * Picpay endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      CreateRefundPicPayServiceKafka,
      CreatePaymentPicPayServiceKafka,
      CreatePreCheckoutPicPayServiceKafka,
      GetPaymentStatusController,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    CreateRefundController,
    CreatePaymentController,
    CreatePreCheckoutController,
    GetPaymentStatusController,
  ],
})
export class PicPayModule {}
