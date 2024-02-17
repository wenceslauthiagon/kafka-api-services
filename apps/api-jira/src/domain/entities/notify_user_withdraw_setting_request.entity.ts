import { Domain } from '@zro/common';
import { NotifyStateType, NotifyEventType } from '@zro/api-jira/domain';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';

export interface NotifyUserWithdrawSettingRequestIssue extends Domain<string> {
  issueId: string;
  issueTypeId?: number;
  issueTypeName?: string;
  issueCreatedAt: Date;
  projectId?: number;
  projectKey?: string;
  projectName?: string;
  priorityId?: number;
  priorityName?: string;
  statusId?: number;
  status: UserWithdrawSettingRequestState;
  state: NotifyStateType;
  userWithdrawSettingRequestId: string;
  summary: string;
  analysisResult?: UserWithdrawSettingRequestAnalysisResultType;
  analysisDetails?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyUserWithdrawSettingRequestIssueEntity
  implements NotifyUserWithdrawSettingRequestIssue
{
  id?: string;
  issueId: string;
  issueTypeId?: number;
  issueTypeName?: string;
  issueCreatedAt: Date;
  projectId?: number;
  projectKey?: string;
  projectName?: string;
  priorityId?: number;
  priorityName?: string;
  statusId?: number;
  status: UserWithdrawSettingRequestState;
  state: NotifyStateType;
  userWithdrawSettingRequestId: string;
  summary: string;
  analysisResult?: UserWithdrawSettingRequestAnalysisResultType;
  analysisDetails?: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyUserWithdrawSettingRequestIssue>) {
    Object.assign(this, props);
  }
}
