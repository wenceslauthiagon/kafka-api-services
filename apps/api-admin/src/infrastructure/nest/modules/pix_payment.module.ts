import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@zro/common';
import {
  GetAllPaymentRestController,
  GetPixDepositByOperationIdRestController,
  GetPaymentByOperationIdRestController,
  GetPixDevolutionByOperationIdRestController,
  GetPixDevolutionReceivedByOperationIdRestController,
  GetAllWarningPixDepositRestController,
} from '@zro/api-admin/infrastructure';
import {
  GetAllPaymentServiceKafka,
  GetAllWarningPixDepositServiceKafka,
  GetPaymentByOperationIdServiceKafka,
  GetPixDepositByOperationIdServiceKafka,
  GetPixDevolutionByOperationIdServiceKafka,
  GetPixDevolutionReceivedByOperationIdServiceKafka,
} from '@zro/pix-payments/infrastructure';
/**
 * PixPayment endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      GetAllPaymentServiceKafka,
      GetAllWarningPixDepositServiceKafka,
      GetPaymentByOperationIdServiceKafka,
      GetPixDepositByOperationIdServiceKafka,
      GetPixDevolutionByOperationIdServiceKafka,
      GetPixDevolutionReceivedByOperationIdServiceKafka,
    ]),
  ],
  providers: [],
  controllers: [
    GetAllPaymentRestController,
    GetPixDepositByOperationIdRestController,
    GetPaymentByOperationIdRestController,
    GetPixDevolutionByOperationIdRestController,
    GetPixDevolutionReceivedByOperationIdRestController,
    GetAllWarningPixDepositRestController,
  ],
})
export class PixPaymentModule {}
