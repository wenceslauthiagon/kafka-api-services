import { Domain } from '@zro/common';
import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  PixAgentMod,
  PaymentPriorityType,
} from '@zro/pix-payments/domain';
import {
  InitiationType,
  NotifyStateType,
  PaymentPriorityLevelType,
  ValueType,
} from '@zro/api-jdpi/domain';

export interface NotifyCreditDepositAmountDetais {
  fareBuyAmount: number;
  valueType: ValueType;
}

export interface NotifyCreditDeposit extends Domain<string> {
  externalId: string;
  endToEndId: string;
  initiationType: InitiationType;
  paymentPriorityType: PaymentPriorityType;
  paymentPriorityLevelType: PaymentPriorityLevelType;
  finalityType: number;
  agentModalityType?: PixAgentMod;
  ispbPss?: string;
  paymentInitiatorDocument?: string;
  clientConciliationId?: string;
  key?: string;
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
  amountDetails?: NotifyCreditDepositAmountDetais[];
  state: NotifyStateType;
  informationBetweenClients?: string;
  createdAt: Date;
}

export class NotifyCreditDepositEntity implements NotifyCreditDeposit {
  id: string;
  externalId: string;
  endToEndId: string;
  initiationType: InitiationType;
  paymentPriorityType: PaymentPriorityType;
  paymentPriorityLevelType: PaymentPriorityLevelType;
  finalityType: number;
  agentModalityType?: PixAgentMod;
  ispbPss?: string;
  paymentInitiatorDocument?: string;
  clientConciliationId?: string;
  key?: string;
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
  amountDetails?: NotifyCreditDepositAmountDetais[];
  state: NotifyStateType;
  informationBetweenClients?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyCreditDeposit>) {
    Object.assign(this, props);
  }
}
