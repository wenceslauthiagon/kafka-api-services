import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import { GetSpreadsByUserAndCurrenciesServiceKafka } from '@zro/otc/infrastructure';
import {
  QuotationModel,
  CreateQuotationMicroserviceController,
  GetQuotationMicroserviceController,
  GetQuotationByIdMicroserviceController,
  GetCurrentQuotationByIdMicroserviceController,
} from '@zro/quotations/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([GetSpreadsByUserAndCurrenciesServiceKafka]),
    DatabaseModule.forFeature([QuotationModel]),
    RedisModule,
  ],
  providers: [],
  controllers: [
    GetQuotationMicroserviceController,
    GetQuotationByIdMicroserviceController,
    GetCurrentQuotationByIdMicroserviceController,
    CreateQuotationMicroserviceController,
  ],
})
export class QuotationModule {}
