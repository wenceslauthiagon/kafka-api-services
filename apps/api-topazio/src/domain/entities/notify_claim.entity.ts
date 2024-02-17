import { Domain } from '@zro/common';
import {
  KeyType,
  ClaimReasonType,
  ClaimStatusType,
  ClaimType,
} from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import { NotifyStateType } from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

export interface NotifyClaim extends Domain<string> {
  externalId: string;
  accountOpeningDate?: Date;
  accountType?: AccountType;
  branch?: string;
  accountNumber?: string;
  claimReason?: ClaimReasonType;
  claimType: ClaimType;
  document?: string;
  donation: boolean;
  donorIspb?: string;
  requestIspb?: string;
  endCompleteDate?: Date;
  endResolutionDate?: Date;
  lastChangeDate?: Date;
  ispb?: string;
  key: string;
  keyType?: KeyType;
  name?: string;
  personType?: PersonType;
  status: ClaimStatusType;
  tradeName?: string;
  state?: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyClaimEntity implements NotifyClaim {
  id?: string;
  externalId: string;
  accountOpeningDate: Date;
  accountType: AccountType;
  branch: string;
  accountNumber: string;
  claimReason: ClaimReasonType;
  claimType: ClaimType;
  document: string;
  donation: boolean;
  donorIspb: string;
  requestIspb: string;
  endCompleteDate: Date;
  endResolutionDate: Date;
  lastChangeDate: Date;
  ispb: string;
  key: string;
  keyType: KeyType;
  name: string;
  personType: PersonType;
  status: ClaimStatusType;
  tradeName: string;
  state?: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyClaim>) {
    Object.assign(this, props);
  }
}
