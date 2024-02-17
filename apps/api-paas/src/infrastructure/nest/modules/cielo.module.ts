import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  CreateCieloPreCheckoutController,
  CreditTransactionController,
  NonAuthenticatedDebitTransactionController,
  AuthenticatedDebitTransactionController,
  GetPaymentController,
  CancelTransactionController,
  CapturePaymentController,
} from '@zro/api-paas/infrastructure';
import {
  CancelTransactionCieloServiceKafka,
  CapturePaymentCieloServiceKafka,
  CreateAuthenticatedDebitCieloServiceKafka,
  CreateCreditCieloServiceKafka,
  CreateNonAuthenticatedDebitTransactionCieloServiceKafka,
  CreatePreCheckoutCieloServiceKafka,
  GetPaymentCieloServiceKafka,
} from '@zro/cielo/infrastructure';

/**
 * Cielo endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      CreateCreditCieloServiceKafka,
      GetPaymentCieloServiceKafka,
      CancelTransactionCieloServiceKafka,
      CreateAuthenticatedDebitCieloServiceKafka,
      CreateNonAuthenticatedDebitTransactionCieloServiceKafka,
      CapturePaymentCieloServiceKafka,
      CreatePreCheckoutCieloServiceKafka,
      CreateCreditCieloServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    CreditTransactionController,
    CreateCieloPreCheckoutController,
    CapturePaymentController,
    NonAuthenticatedDebitTransactionController,
    AuthenticatedDebitTransactionController,
    GetPaymentController,
    CancelTransactionController,
  ],
})
export class CieloModule {}
