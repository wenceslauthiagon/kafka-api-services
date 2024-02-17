import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, CacheModule } from '@zro/common';
import {
  BinanceAxiosService,
  BinanceGetMarketsService,
  BinanceQuotationService,
} from '@zro/binance/infrastructure';
import { StreamQuotationGatewayModule } from '@zro/quotations/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule, CacheModule.registerAsync()],
  providers: [
    BinanceQuotationService,
    BinanceAxiosService,
    BinanceGetMarketsService,
  ],
  exports: [BinanceQuotationService],
})
@StreamQuotationGatewayModule()
export class BinanceQuotationModule {}
