import { File } from '@zro/common';
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @File()
  @HealthCheck()
  execute() {
    return this.health.check([]);
  }
}
