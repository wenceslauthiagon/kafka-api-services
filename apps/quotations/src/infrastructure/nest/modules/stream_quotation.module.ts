import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
  PrometheusModule,
  DatabaseModule,
} from '@zro/common';
import {
  GetStreamQuotationCronService,
  LoadGetStreamQuotationService,
  GetStreamQuotationGatewayCronService,
  SyncCurrencyStreamQuotationCronService,
  GetStreamQuotationByBaseCurrencyMicroserviceController,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameMicroserviceController,
  LoadActiveCurrenciesService,
} from '@zro/quotations/infrastructure';
import { GetAllCurrencyServiceKafka } from '@zro/operations/infrastructure';
import { B2C2QuotationModule } from '@zro/b2c2';
import { ApiLayerQuotationModule } from '@zro/apilayer';
import { MercadoBitcoinQuotationModule } from '@zro/mercado-bitcoin';
import { BinanceQuotationModule } from '@zro/binance';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([GetAllCurrencyServiceKafka]),
    DatabaseModule.forFeature(),
    RedisModule,
    PrometheusModule,
    ApiLayerQuotationModule,
    B2C2QuotationModule,
    MercadoBitcoinQuotationModule,
    BinanceQuotationModule,
  ],
  providers: [
    LoadGetStreamQuotationService,
    LoadActiveCurrenciesService,
    GetStreamQuotationGatewayCronService,
    GetStreamQuotationCronService,
    SyncCurrencyStreamQuotationCronService,
  ],
  controllers: [
    GetStreamQuotationByBaseCurrencyMicroserviceController,
    GetStreamQuotationByBaseAndQuoteAndGatewayNameMicroserviceController,
  ],
})
export class StreamQuotationModule {}
