import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
  ValidationModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import {
  PaymentModel,
  CreateByAccountPaymentMicroserviceController,
  GetPaymentByIdMicroserviceController,
  PendingPaymentNestObserver,
  PaymentCronServiceInit,
  CancelPaymentByOperationIdMicroserviceController,
  CreateByQrCodeStaticPaymentMicroserviceController,
  WithdrawalByQrCodeStaticPaymentMicroserviceController,
  DuedateByQrCodeDynamicPaymentMicroserviceController,
  CreateByQrCodeDynamicPaymentMicroserviceController,
  WithdrawalByQrCodeDynamicPaymentMicroserviceController,
  ChangeByQrCodeDynamicPaymentMicroserviceController,
  RevertPaymentNestObserver,
  CompletePaymentNestObserver,
  GetAllPaymentMicroserviceController,
  GetAllPaymentByWalletMicroserviceController,
  CreateByPixKeyPaymentMicroserviceController,
  GetReceiptByOperationIdMicroserviceController,
  ReceivePaymentChargebackMicroserviceController,
  GetPaymentByOperationIdMicroserviceController,
  GetPaymentByEndToEndIdMicroserviceController,
  RecentPaymentCronServiceInit,
  RecentPixDevolutionCronServiceInit,
  RecentPixRefundDevolutionCronServiceInit,
  RecentWarningPixDevolutionCronServiceInit,
  CreateByAccountAndDecodedPaymentMicroserviceController,
} from '@zro/pix-payments/infrastructure';
import { GetOnboardingByDocumentAndStatusIsFinishedServiceKafka } from '@zro/users/infrastructure';
import {
  GetByIdDecodedPixKeyServiceKafka,
  UpdateStateByIdDecodedPixKeyServiceKafka,
} from '@zro/pix-keys/infrastructure';
import { SetOperationReferenceByIdServiceKafka } from '@zro/operations/infrastructure';
import { TopazioKycModule } from '@zro/topazio';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetOnboardingByDocumentAndStatusIsFinishedServiceKafka,
      GetByIdDecodedPixKeyServiceKafka,
      UpdateStateByIdDecodedPixKeyServiceKafka,
      SetOperationReferenceByIdServiceKafka,
    ]),
    DatabaseModule.forFeature([PaymentModel]),
    JdpiPixModule,
    TranslateModule,
    TopazioKycModule,
  ],
  controllers: [
    CreateByAccountPaymentMicroserviceController,
    GetPaymentByIdMicroserviceController,
    GetPaymentByEndToEndIdMicroserviceController,
    PendingPaymentNestObserver,
    CreateByQrCodeStaticPaymentMicroserviceController,
    WithdrawalByQrCodeStaticPaymentMicroserviceController,
    CreateByQrCodeDynamicPaymentMicroserviceController,
    WithdrawalByQrCodeDynamicPaymentMicroserviceController,
    DuedateByQrCodeDynamicPaymentMicroserviceController,
    ChangeByQrCodeDynamicPaymentMicroserviceController,
    RevertPaymentNestObserver,
    CompletePaymentNestObserver,
    CancelPaymentByOperationIdMicroserviceController,
    GetAllPaymentMicroserviceController,
    GetAllPaymentByWalletMicroserviceController,
    CreateByPixKeyPaymentMicroserviceController,
    GetReceiptByOperationIdMicroserviceController,
    ReceivePaymentChargebackMicroserviceController,
    GetPaymentByOperationIdMicroserviceController,
    CreateByAccountAndDecodedPaymentMicroserviceController,
  ],
  providers: [
    PaymentCronServiceInit,
    RecentPaymentCronServiceInit,
    RecentPixDevolutionCronServiceInit,
    RecentPixRefundDevolutionCronServiceInit,
    RecentWarningPixDevolutionCronServiceInit,
  ],
})
export class PaymentModule {}
