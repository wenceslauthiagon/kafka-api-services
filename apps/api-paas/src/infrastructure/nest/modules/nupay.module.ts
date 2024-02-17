import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  NuPayCancelPaymentController,
  NuPayCreatePaymentController,
  NuPayGetAllPaymentController,
  NuPayGetByIdPaymentController,
  NuPayCreateRefundController,
  PreCheckoutController,
} from '@zro/api-paas/infrastructure';
import {
  CancelPaymentNuPayServiceKafka,
  CreatePaymentNuPayServiceKafka,
  CreateRefundNuPayServiceKafka,
  GetAllPaymentNuPayServiceKafka,
  GetByIdPaymentNuPayServiceKafka,
  PreCheckoutNuPayServiceKafka,
} from '@zro/nupay/infrastructure';

/**
 * Nupay endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      PreCheckoutNuPayServiceKafka,
      CreateRefundNuPayServiceKafka,
      GetByIdPaymentNuPayServiceKafka,
      GetAllPaymentNuPayServiceKafka,
      CreatePaymentNuPayServiceKafka,
      CancelPaymentNuPayServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    NuPayCancelPaymentController,
    NuPayCreatePaymentController,
    NuPayGetAllPaymentController,
    NuPayGetByIdPaymentController,
    NuPayCreateRefundController,
    PreCheckoutController,
  ],
})
export class NuPayModule {}
