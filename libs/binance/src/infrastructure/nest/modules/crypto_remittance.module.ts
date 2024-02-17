import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, CacheModule } from '@zro/common';
import {
  BinanceAxiosService,
  BinanceCryptoRemittanceService,
} from '@zro/binance/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule, CacheModule.registerAsync()],
  providers: [BinanceCryptoRemittanceService, BinanceAxiosService],
  exports: [BinanceCryptoRemittanceService],
})
export class BinanceCryptoRemittanceModule {}
