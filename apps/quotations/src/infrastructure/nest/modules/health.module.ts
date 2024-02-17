import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import {
  HealthController,
  QuotationHealthIndicator,
} from '@zro/quotations/infrastructure';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [QuotationHealthIndicator],
})
export class HealthModule {}
