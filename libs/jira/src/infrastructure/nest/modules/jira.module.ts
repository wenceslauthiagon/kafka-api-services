import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JiraPixService } from '../providers/jira_pix.service';
import { JiraComplianceModule } from './jira_compliance.module';
import { JiraComplianceService } from '../providers/jira_compliance.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [JiraPixService, JiraComplianceModule, JiraComplianceService],
  exports: [JiraPixService, JiraComplianceModule, JiraComplianceService],
})
export class JiraModule {}
