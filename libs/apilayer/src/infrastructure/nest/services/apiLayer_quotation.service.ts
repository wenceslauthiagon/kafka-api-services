import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { GetStreamQuotationGateway } from '@zro/quotations/application';
import {
  GetStreamQuotationService,
  StreamQuotationGatewayController,
} from '@zro/quotations/infrastructure';
import { ApiLayerGetStreamQuotationGateway } from '@zro/apilayer/infrastructure';

export interface ApiLayerGetStreamQuotationConfig {
  APP_APILAYER_BASE_URL: string;
  APP_APILAYER_ACCESS_KEY: string;
}

@Injectable()
@StreamQuotationGatewayController()
export class ApiLayerGetStreamQuotationService
  implements GetStreamQuotationService
{
  private readonly gateway: ApiLayerGetStreamQuotationGateway;

  constructor(
    @InjectLogger() readonly logger: Logger,
    readonly configService: ConfigService<ApiLayerGetStreamQuotationConfig>,
  ) {
    this.logger = logger.child({
      context: ApiLayerGetStreamQuotationService.name,
    });

    const baseURL = configService.get<string>('APP_APILAYER_BASE_URL');
    const accessKey = configService.get<string>('APP_APILAYER_ACCESS_KEY');

    this.gateway = new ApiLayerGetStreamQuotationGateway({
      logger,
      baseURL,
      accessKey,
    });
  }

  getGateway(): GetStreamQuotationGateway {
    return this.gateway;
  }
}
