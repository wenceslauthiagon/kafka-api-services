import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import {
  MercadoBitcoinAxiosPublicService,
  MercadoBitcoinHistoricalCryptoPriceService,
} from '@zro/mercado-bitcoin/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    MercadoBitcoinHistoricalCryptoPriceService,
    MercadoBitcoinAxiosPublicService,
  ],
  exports: [MercadoBitcoinHistoricalCryptoPriceService],
})
export class MercadoBitcoinHistoricalCryptoPriceModule {}
