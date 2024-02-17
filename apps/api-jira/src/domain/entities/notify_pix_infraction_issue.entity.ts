import { Domain } from '@zro/common';
import {
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionAnalysisResultType,
} from '@zro/pix-payments/domain';
import { NotifyStateType, NotifyEventType } from '@zro/api-jira/domain';

export interface NotifyPixInfractionIssue extends Domain<string> {
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
  status: PixInfractionStatus;
  state: NotifyStateType;
  operationId: string;
  description?: string;
  infractionType: PixInfractionType;
  summary: string;
  analysisResult?: PixInfractionAnalysisResultType;
  analysisDetails?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyPixInfractionIssueEntity
  implements NotifyPixInfractionIssue
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
  status: PixInfractionStatus;
  state: NotifyStateType;
  operationId: string;
  description?: string;
  infractionType: PixInfractionType;
  summary: string;
  analysisResult?: PixInfractionAnalysisResultType;
  analysisDetails?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyPixInfractionIssue>) {
    Object.assign(this, props);
  }
}
