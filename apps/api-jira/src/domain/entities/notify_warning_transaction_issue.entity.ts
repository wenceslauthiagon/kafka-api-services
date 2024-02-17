import { Domain } from '@zro/common';
import { NotifyStateType, NotifyEventType } from '@zro/api-jira/domain';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionStatus,
} from '@zro/compliance/domain';

export interface NotifyWarningTransactionIssue extends Domain<string> {
  issueId: number;
  issueTypeId?: number;
  issueTypeName?: string;
  issueCreatedAt: Date;
  projectId?: number;
  projectKey?: string;
  projectName?: string;
  priorityId?: number;
  priorityName?: string;
  statusId?: number;
  status: WarningTransactionStatus;
  state: NotifyStateType;
  operationId: string;
  summary: string;
  analysisResult?: WarningTransactionAnalysisResultType;
  analysisDetails?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyWarningTransactionIssueEntity
  implements NotifyWarningTransactionIssue
{
  id?: string;
  issueId: number;
  issueTypeId?: number;
  issueTypeName?: string;
  issueCreatedAt: Date;
  projectId?: number;
  projectKey?: string;
  projectName?: string;
  priorityId?: number;
  priorityName?: string;
  statusId?: number;
  status: WarningTransactionStatus;
  state: NotifyStateType;
  operationId: string;
  summary: string;
  analysisResult?: WarningTransactionAnalysisResultType;
  analysisDetails?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyWarningTransactionIssue>) {
    Object.assign(this, props);
  }
}
