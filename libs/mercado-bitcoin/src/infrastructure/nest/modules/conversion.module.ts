import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule, CacheModule } from '@zro/common';
import {
  MercadoBitcoinAuthService,
  MercadoBitcoinAxiosService,
  MercadoBitcoinCryptoRemittanceService,
} from '@zro/mercado-bitcoin/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    CacheModule.registerAsync(),
    ScheduleModule.forRoot(),
  ],
  providers: [
    MercadoBitcoinCryptoRemittanceService,
    MercadoBitcoinAxiosService,
    MercadoBitcoinAuthService,
  ],
  exports: [MercadoBitcoinCryptoRemittanceService],
})
export class MercadoBitcoinConversionModule {}
