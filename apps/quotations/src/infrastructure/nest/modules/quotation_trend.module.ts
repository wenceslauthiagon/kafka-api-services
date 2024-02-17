import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  KafkaModule,
  LoggerModule,
  ValidationModule,
  PrometheusModule,
  DatabaseModule,
} from '@zro/common';
import {
  GetTrendsByWindowAndResolutionAndBaseCurrenciesMicroserviceController,
  LoadActiveCurrenciesService,
} from '@zro/quotations/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature(),
    PrometheusModule,
  ],
  providers: [LoadActiveCurrenciesService],
  controllers: [
    GetTrendsByWindowAndResolutionAndBaseCurrenciesMicroserviceController,
  ],
})
export class QuotationTrendModule {}
