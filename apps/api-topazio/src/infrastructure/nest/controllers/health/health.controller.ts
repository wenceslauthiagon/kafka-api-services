import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { File, Public } from '@zro/common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @ApiOperation({ summary: 'Health check path.' })
  @Get()
  @File()
  @Public()
  @HealthCheck()
  execute() {
    return this.health.check([]);
  }
}
