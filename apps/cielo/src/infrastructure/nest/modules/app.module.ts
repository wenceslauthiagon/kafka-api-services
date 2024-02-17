import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  BugReportModule,
  CacheModule,
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import {
  CancelTransactionMicroserviceController,
  CapturePaymentMicroserviceController,
  CreateAuthenticatedDebitTransactionMicroserviceController,
  CreateCreditTransactionMicroserviceController,
  CreateNonAuthenticatedDebitTransactionMicroserviceController,
  CreatePreCheckoutMicroserviceController,
  GetPaymentMicroserviceController,
  CheckoutHistoricModel,
  CheckoutModel,
  CieloAxiosService,
  PaymentCronService,
  CieloClientHttpService,
} from '@zro/cielo/infrastructure';
import { HealthModule } from './health.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ envFilePath: ['.cielo.env'] }),
    CacheModule.registerAsync(),
    DatabaseModule.forFeature([CheckoutModel, CheckoutHistoricModel]),
    RedisModule,
    KafkaModule.forFeature(),
    LoggerModule,
    BugReportModule,
    ValidationModule,
    HealthModule,
  ],
  controllers: [
    CancelTransactionMicroserviceController,
    CapturePaymentMicroserviceController,
    CreateAuthenticatedDebitTransactionMicroserviceController,
    CreateNonAuthenticatedDebitTransactionMicroserviceController,
    CreateCreditTransactionMicroserviceController,
    CreatePreCheckoutMicroserviceController,
    GetPaymentMicroserviceController,
  ],
  providers: [
    Logger,
    PaymentCronService,
    CieloAxiosService,
    CieloClientHttpService,
  ],
})
export class AppModule {}
