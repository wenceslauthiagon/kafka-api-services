import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '@zro/otc/infrastructure';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
