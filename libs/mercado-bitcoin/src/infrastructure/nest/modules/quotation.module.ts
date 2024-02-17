import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, CacheModule } from '@zro/common';
import { StreamQuotationGatewayModule } from '@zro/quotations/infrastructure';
import {
  MercadoBitcoinGetMarketsService,
  MercadoBitcoinGetStreamQuotationService,
} from '@zro/mercado-bitcoin/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule, CacheModule.registerAsync()],
  providers: [
    MercadoBitcoinGetStreamQuotationService,
    MercadoBitcoinGetMarketsService,
  ],
  exports: [MercadoBitcoinGetStreamQuotationService],
})
@StreamQuotationGatewayModule()
export class MercadoBitcoinQuotationModule {}
