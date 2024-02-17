import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { EguardianReportService } from '../providers/eguardian_report.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [EguardianReportService],
  exports: [EguardianReportService],
})
export class EguardianModule {}
