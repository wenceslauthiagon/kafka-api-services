import { Domain } from '@zro/common';
import { User, Address } from '@zro/users/domain';

export enum OnboardingStatus {
  PENDING = 'pending',
  INVALID = 'invalid',
  IN_PROCESS = 'in_process',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FINISHED = 'finished',
}

export interface Onboarding extends Domain<string> {
  user: User;
  document?: string;
  status: OnboardingStatus;
  fullName?: string;
  accountNumber?: string;
  branch?: string;
  address?: Address;
  occupationIncome?: number;
  createdAt?: Date;
  updatedAt?: Date;
  discardedAt?: Date;
  reviewAssignee?: number;
  occupationCbo?: number;
  pepSince?: string;
  isFinished(): boolean;
}

export class OnboardingEntity implements Onboarding {
  id: string;
  user: User;
  document?: string;
  status: OnboardingStatus;
  fullName?: string;
  accountNumber?: string;
  branch?: string;
  address?: Address;
  occupationIncome?: number;
  createdAt: Date;
  updatedAt: Date;
  discardedAt?: Date;
  reviewAssignee?: number;
  occupationCbo?: number;
  pepSince?: string;

  constructor(props: Partial<Onboarding> = {}) {
    Object.assign(this, props);
  }

  isFinished() {
    return this.status === OnboardingStatus.FINISHED;
  }
}
