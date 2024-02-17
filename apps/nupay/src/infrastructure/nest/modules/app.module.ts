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
  CreatePaymentMicroserviceController,
  CreateRefundMicroserviceController,
  PreCheckoutMicroserviceController,
  PaymentCronService,
  CheckoutModel,
  CheckoutHistoricModel,
  CancelPaymentMicroserviceController,
  GetAllPaymentMicroserviceController,
  GetByIdPaymentMicroserviceController,
  NuPayClientService,
  NuPayAxiosService,
} from '@zro/nupay/infrastructure';
import { HealthModule } from './health.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ envFilePath: ['.nupay.env'] }),
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
    CancelPaymentMicroserviceController,
    CreatePaymentMicroserviceController,
    GetAllPaymentMicroserviceController,
    GetByIdPaymentMicroserviceController,
    PreCheckoutMicroserviceController,
    CreateRefundMicroserviceController,
  ],
  providers: [
    Logger,
    PaymentCronService,
    NuPayAxiosService,
    NuPayClientService,
  ],
})
export class AppModule {}
