import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JiraComplianceService } from '../providers/jira_compliance.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [JiraComplianceService],
  exports: [JiraComplianceService],
})
export class JiraComplianceModule {}
