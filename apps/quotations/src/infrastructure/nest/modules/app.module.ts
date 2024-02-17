import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BugReportModule, CacheModule, LoggerModule } from '@zro/common';
import { HealthModule } from './health.module';
import { QuotationModule } from './quotation.module';
import { StreamPairModule } from './stream_pair.module';
import { QuotationTrendModule } from './quotation_trend.module';
import { StreamQuotationModule } from './stream_quotation.module';
import { HolidayModule } from './holiday.module';
import { TaxModule } from './tax.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.quotations.env'] }),
    CacheModule.registerAsync(),
    LoggerModule,
    BugReportModule,
    QuotationModule,
    StreamPairModule,
    QuotationTrendModule,
    StreamQuotationModule,
    HealthModule,
    HolidayModule,
    TaxModule,
  ],
  providers: [Logger],
})
export class AppModule {}
