import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, CacheModule } from '@zro/common';
import {
  B2C2AxiosService,
  B2C2GetMarketsService,
  B2C2QuotationService,
} from '@zro/b2c2/infrastructure';
import { StreamQuotationGatewayModule } from '@zro/quotations/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule, CacheModule.registerAsync()],
  providers: [B2C2QuotationService, B2C2AxiosService, B2C2GetMarketsService],
  exports: [B2C2QuotationService],
})
@StreamQuotationGatewayModule()
export class B2C2QuotationModule {}
