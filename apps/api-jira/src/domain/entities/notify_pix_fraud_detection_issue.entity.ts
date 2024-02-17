import { Domain } from '@zro/common';
import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { NotifyStateType, NotifyEventType } from '@zro/api-jira/domain';

export interface NotifyPixFraudDetectionIssue extends Domain<string> {
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
  status: PixFraudDetectionStatus;
  state: NotifyStateType;
  summary: string;
  externalId?: string;
  document: string;
  fraudType: PixFraudDetectionType;
  key?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyPixFraudDetectionIssueEntity
  implements NotifyPixFraudDetectionIssue
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
  status: PixFraudDetectionStatus;
  state: NotifyStateType;
  summary: string;
  externalId?: string;
  document: string;
  fraudType: PixFraudDetectionType;
  key?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyPixFraudDetectionIssue>) {
    Object.assign(this, props);
  }
}
