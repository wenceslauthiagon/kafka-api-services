import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  GetQuotationRestController,
  V2GetQuotationRestController,
} from '@zro/api-paas/infrastructure';
import { GetQuotationServiceKafka } from '@zro/quotations/infrastructure';

/**
 * Quotations endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([GetQuotationServiceKafka]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [GetQuotationRestController, V2GetQuotationRestController],
})
export class QuotationModule {}
