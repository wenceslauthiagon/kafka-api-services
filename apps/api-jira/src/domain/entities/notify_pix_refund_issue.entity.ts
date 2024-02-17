import { Domain } from '@zro/common';
import {
  PixRefundStatus,
  PixRefundRejectionReason,
  PixRefundReason,
} from '@zro/pix-payments/domain';
import { NotifyStateType, NotifyEventType } from '@zro/api-jira/domain';

export interface NotifyPixRefundIssue extends Domain<string> {
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
  status: PixRefundStatus;
  state: NotifyStateType;
  operationId: string;
  description?: string;
  reason?: PixRefundReason;
  analysisDetails?: string;
  rejectionReason?: PixRefundRejectionReason;
  summary: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  eventType: NotifyEventType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyPixRefundIssueEntity implements NotifyPixRefundIssue {
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
  status: PixRefundStatus;
  eventType: NotifyEventType;
  state: NotifyStateType;
  operationId: string;
  description?: string;
  reason?: PixRefundReason;
  analysisDetails?: string;
  rejectionReason?: PixRefundRejectionReason;
  summary: string;
  assigneeName?: string;
  creatorName?: string;
  reporterName?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyPixRefundIssue>) {
    Object.assign(this, props);
  }
}
