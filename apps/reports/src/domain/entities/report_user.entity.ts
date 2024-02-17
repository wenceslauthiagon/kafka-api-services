import { Domain } from '@zro/common';
import {
  Address,
  Occupation,
  Onboarding,
  User,
  UserLegalAdditionalInfo,
} from '@zro/users/domain';
import { UserLimit } from '@zro/operations/domain';
import { Admin } from '@zro/admin/domain';

export enum ReportUserProfileType {
  PJ = 'PJ',
  PF = 'PF',
}

export enum ReportPaymentAccountHolderGroupType {
  PF = 'PF- Bitblue',
  PJ = 'Pj - Zro',
}

/**
 * Report User.
 */
export interface ReportUser extends Domain<string> {
  user: User;
  address: Address;
  onboarding: Onboarding;
  admin?: Admin;
  userLimit: UserLimit;
  occupation?: Occupation;
  userLegalAdditionalInfo?: UserLegalAdditionalInfo;
  createdAt: Date;
  updatedAt: Date;
}

export class ReportUserEntity implements ReportUser {
  id!: string;
  user: User;
  address: Address;
  onboarding: Onboarding;
  admin?: Admin;
  userLimit: UserLimit;
  occupation?: Occupation;
  userLegalAdditionalInfo?: UserLegalAdditionalInfo;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<ReportUser>) {
    Object.assign(this, props);
  }
}
