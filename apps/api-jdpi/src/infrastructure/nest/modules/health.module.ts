import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '@zro/api-jdpi/infrastructure';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
