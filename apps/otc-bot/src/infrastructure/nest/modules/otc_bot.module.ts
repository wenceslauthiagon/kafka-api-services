import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import {
  BotOtcModel,
  BotOtcOrderModel,
  BotOtcCronService,
  BotOtcOrderPendingCronService,
  SoldBotOtcOrderNestObserver,
  SyncBotOtcOrderFilledCronService,
  UpdateBotOtcOrderByRemittanceMicroserviceController,
  GetBotOtcAnalysisMicroserviceController,
  GetBotOtcOrderByIdMicroserviceController,
  GetAllBotOtcOrdersByFilterMicroserviceController,
  UpdateBotOtcMicroServiceController,
} from '@zro/otc-bot/infrastructure';
import { B2C2CryptoRemittanceModule } from '@zro/b2c2';
import { BinanceCryptoRemittanceModule } from '@zro/binance';
import { GetCurrencyByIdServiceKafka } from '@zro/operations/infrastructure';
import {
  CreateCryptoOrderServiceKafka,
  CreateCryptoRemittanceServiceKafka,
  GetCryptoOrderByIdServiceKafka,
  GetCryptoRemittanceByIdServiceKafka,
  GetProviderByIdServiceKafka,
  GetRemittanceByIdServiceKafka,
  GetSystemByNameServiceKafka,
} from '@zro/otc/infrastructure';
import {
  GetAllTaxServiceKafka,
  GetStreamPairByIdServiceKafka,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka,
} from '@zro/quotations/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetCurrencyByIdServiceKafka,
      CreateCryptoOrderServiceKafka,
      CreateCryptoRemittanceServiceKafka,
      GetCryptoOrderByIdServiceKafka,
      GetCryptoRemittanceByIdServiceKafka,
      GetProviderByIdServiceKafka,
      GetRemittanceByIdServiceKafka,
      GetSystemByNameServiceKafka,
      GetAllTaxServiceKafka,
      GetStreamPairByIdServiceKafka,
      GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka,
    ]),
    RedisModule,
    DatabaseModule.forFeature([BotOtcModel, BotOtcOrderModel]),
    B2C2CryptoRemittanceModule,
    BinanceCryptoRemittanceModule,
  ],
  controllers: [
    SoldBotOtcOrderNestObserver,
    UpdateBotOtcOrderByRemittanceMicroserviceController,
    GetBotOtcAnalysisMicroserviceController,
    GetBotOtcOrderByIdMicroserviceController,
    GetAllBotOtcOrdersByFilterMicroserviceController,
    UpdateBotOtcMicroServiceController,
  ],
  providers: [
    BotOtcCronService,
    BotOtcOrderPendingCronService,
    SyncBotOtcOrderFilledCronService,
  ],
})
export class BotOtcModule {}
