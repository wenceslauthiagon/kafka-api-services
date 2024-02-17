import { File } from '@zro/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicator,
} from '@nestjs/terminus';
import { Controller, Get, Injectable } from '@nestjs/common';

@Injectable()
export class QuotationHealthIndicator extends HealthIndicator {
  constructor() {
    super();
  }

  async check(key: string) {
    /*
    const streamQuotationRepository = new StreamQuotationRedisRepository(
      this.redisService,
    );

    // FIXME: Choose only one key to search on streamQuotationRepository.
    const response = await streamQuotationRepository.getAll();
    */

    return super.getStatus(key, true);
  }
}

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private quotationHealthIndicator: QuotationHealthIndicator,
  ) {}

  @Get()
  @File()
  @HealthCheck()
  async execute() {
    const quotationHealthResult =
      this.quotationHealthIndicator.check('QUOTATION');

    return this.health.check([() => quotationHealthResult]);
  }
}
