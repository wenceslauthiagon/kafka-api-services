import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { File } from '@zro/common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @ApiOperation({ summary: 'Health check path.' })
  @Get()
  @File()
  @HealthCheck()
  execute() {
    return this.health.check([]);
  }
}
