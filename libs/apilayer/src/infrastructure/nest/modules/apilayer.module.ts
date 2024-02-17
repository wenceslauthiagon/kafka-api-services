import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { StreamQuotationGatewayModule } from '@zro/quotations/infrastructure';
import { ApiLayerGetStreamQuotationService } from '../services/apiLayer_quotation.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [ApiLayerGetStreamQuotationService],
  exports: [ApiLayerGetStreamQuotationService],
})
@StreamQuotationGatewayModule()
export class ApiLayerQuotationModule {}
