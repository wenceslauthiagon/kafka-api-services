import { Domain } from '@zro/common';
import { UserLimit } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export enum UserLimitRequestStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum UserLimitRequestState {
  OPEN_PENDING = 'OPEN_PENDING',
  OPEN_CONFIRMED = 'OPEN_CONFIRMED',
  CLOSED_CONFIRMED_APPROVED = 'CLOSED_CONFIRMED_APPROVED',
  CLOSED_CONFIRMED_REJECTED = 'CLOSED_CONFIRMED_REJECTED',
  ERROR = 'ERROR',
}

export enum UserLimitRequestAnalysisResultType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface UserLimitRequest extends Domain<string> {
  status: UserLimitRequestStatus;
  state: UserLimitRequestState;
  analysisResult?: UserLimitRequestAnalysisResultType;
  user: User;
  userLimit: UserLimit;
  limitTypeDescription?: string;
  requestYearlyLimit?: number;
  requestMonthlyLimit?: number;
  requestDailyLimit?: number;
  requestNightlyLimit?: number;
  requestMaxAmount?: number;
  requestMinAmount?: number;
  requestMaxAmountNightly?: number;
  requestMinAmountNightly?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserLimitRequestEntity implements UserLimitRequest {
  id: string;
  status: UserLimitRequestStatus;
  state: UserLimitRequestState;
  analysisResult?: UserLimitRequestAnalysisResultType;
  user: User;
  userLimit: UserLimit;
  limitTypeDescription?: string;
  requestYearlyLimit?: number;
  requestMonthlyLimit?: number;
  requestDailyLimit?: number;
  requestNightlyLimit?: number;
  requestMaxAmount?: number;
  requestMinAmount?: number;
  requestMaxAmountNightly?: number;
  requestMinAmountNightly?: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<UserLimitRequest> = {}) {
    Object.assign(this, props);
  }
}
