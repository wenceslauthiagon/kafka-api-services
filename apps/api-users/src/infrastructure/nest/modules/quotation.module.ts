import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, ValidationModule } from '@zro/common';
import {
  GetQuotationRestController,
  V2GetQuotationRestController,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesRestController,
} from '@zro/api-users/infrastructure';
import {
  GetQuotationServiceKafka,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesServiceKafka,
} from '@zro/quotations/infrastructure';

/**
 * Quotations endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      GetQuotationServiceKafka,
      GetTrendsByWindowAndResolutionAndBaseCurrenciesServiceKafka,
    ]),
    ValidationModule,
  ],
  controllers: [
    GetQuotationRestController,
    V2GetQuotationRestController,
    GetTrendsByWindowAndResolutionAndBaseCurrenciesRestController,
  ],
})
export class QuotationModule {}
