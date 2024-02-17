import { Domain } from '@zro/common';
import {
  UserLimitRequestAnalysisResultType,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';

export enum UserLimitRequestNotifyStateType {
  READY = 'READY',
  ERROR = 'ERROR',
  CANCELED = 'CANCELED',
}

export enum UserLimitRequestNotifyEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
}

export interface NotifyUserLimitRequestIssue extends Domain<string> {
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
  status: UserLimitRequestStatus;
  state: UserLimitRequestNotifyStateType;
  summary: string;
  userLimitRequestId: string;
  analysisResult?: UserLimitRequestAnalysisResultType;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: UserLimitRequestNotifyEventType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyUserLimitRequestIssueEntity
  implements NotifyUserLimitRequestIssue
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
  status: UserLimitRequestStatus;
  state: UserLimitRequestNotifyStateType;
  summary: string;
  userLimitRequestId: string;
  analysisResult?: UserLimitRequestAnalysisResultType;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: UserLimitRequestNotifyEventType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyUserLimitRequestIssue>) {
    Object.assign(this, props);
  }
}
