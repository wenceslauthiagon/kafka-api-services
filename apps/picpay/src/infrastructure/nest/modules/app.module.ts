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
  GetPaymentStatusMicroserviceController,
  CreatePaymentMicroserviceController,
  CreateRefundMicroserviceController,
  CreateCheckoutMicroserviceController,
  PaymentCronService,
  CheckoutModel,
  CheckoutHistoricModel,
  PicPayAxiosService,
  PicpayClientService,
} from '@zro/picpay/infrastructure';
import { HealthModule } from './health.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ envFilePath: ['.picpay.env'] }),
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
    GetPaymentStatusMicroserviceController,
    CreatePaymentMicroserviceController,
    CreateRefundMicroserviceController,
    CreateCheckoutMicroserviceController,
  ],
  providers: [
    Logger,
    PaymentCronService,
    PicPayAxiosService,
    PicpayClientService,
  ],
})
export class AppModule {}
