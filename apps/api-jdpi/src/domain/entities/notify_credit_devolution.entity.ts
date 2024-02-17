import { Domain } from '@zro/common';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { NotifyStateType } from '@zro/api-jdpi/domain';

export interface NotifyCreditDevolution extends Domain<string> {
  externalId: string;
  originalEndToEndId: string;
  devolutionEndToEndId: string;
  devolutionCode: string;
  devolutionReason?: string;
  thirdPartIspb: string;
  thirdPartPersonType: PersonType;
  thirdPartDocument: string;
  thirdPartBranch?: string;
  thirdPartAccountType: AccountType;
  thirdPartAccountNumber: string;
  thirdPartName: string;
  clientIspb: string;
  clientPersonType: PersonType;
  clientDocument: string;
  clientBranch?: string;
  clientAccountType: AccountType;
  clientAccountNumber: string;
  amount: number;
  state: NotifyStateType;
  informationBetweenClients?: string;
  createdAt: Date;
}

export class NotifyCreditDevolutionEntity implements NotifyCreditDevolution {
  id: string;
  externalId: string;
  originalEndToEndId: string;
  devolutionEndToEndId: string;
  devolutionCode: string;
  devolutionReason?: string;
  thirdPartIspb: string;
  thirdPartPersonType: PersonType;
  thirdPartDocument: string;
  thirdPartBranch?: string;
  thirdPartAccountType: AccountType;
  thirdPartAccountNumber: string;
  thirdPartName: string;
  clientIspb: string;
  clientPersonType: PersonType;
  clientDocument: string;
  clientBranch?: string;
  clientAccountType: AccountType;
  clientAccountNumber: string;
  amount: number;
  informationBetweenClients?: string;
  state: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyCreditDevolution>) {
    Object.assign(this, props);
  }
}
