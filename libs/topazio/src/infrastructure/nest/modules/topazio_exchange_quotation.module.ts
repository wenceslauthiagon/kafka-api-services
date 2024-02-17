import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TopazioExchangeQuotationService } from '../providers/topazio_exchange_quotation.service';
import { TopazioAuthModule } from './topazio_auth.module';
import { TopazioUtilModule } from './topazio_util.module';

@Module({
  imports: [ConfigModule, LoggerModule, TopazioUtilModule, TopazioAuthModule],
  providers: [TopazioExchangeQuotationService],
  exports: [TopazioExchangeQuotationService],
})
export class TopazioExchangeQuotationModule {}
