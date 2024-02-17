import { Domain } from '@zro/common';
import {
  ResultType,
  PaymentPriorityLevelType,
  ValueType,
  InitiationType,
  NotifyCreditValidationState,
} from '@zro/api-jdpi/domain';
import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  PaymentPriorityType,
  PixAgentMod,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';
import { JdpiErrorCode } from '@zro/jdpi/domain';

export interface NotifyCreditValidationAmountDetails {
  fareBuyAmount: number;
  valueType: ValueType;
}

export interface NotifyCreditValidationResponse {
  resultType: ResultType;
  devolutionCode?: JdpiErrorCode;
  description?: string;
  createdAt: Date;
}

export interface NotifyCreditValidation extends Domain<string> {
  initiationType: InitiationType;
  paymentPriorityType: PaymentPriorityType;
  paymentPriorityLevelType: PaymentPriorityLevelType;
  finalityType: number;
  agentModalityType?: PixAgentMod;
  ispbPss?: string;
  paymentInitiatorDocument?: string;
  thirdPartIspb: string;
  thirdPartPersonType: PersonType;
  thirdPartDocument: string;
  thirdPartName: string;
  thirdPartBranch?: string;
  thirdPartAccountType: AccountType;
  thirdPartAccountNumber: string;
  clientIspb: string;
  clientPersonType: PersonType;
  clientDocument: string;
  clientBranch?: string;
  clientAccountType: AccountType;
  clientAccountNumber: string;
  amount: number;
  amountDetails?: NotifyCreditValidationAmountDetails[];
  informationBetweenClients?: string;
  state?: NotifyCreditValidationState;
  endToEndId?: string;
  clientConciliationId?: string;
  key?: string;
  originalEndToEndId?: string;
  devolutionEndToEndId?: string;
  devolutionCode?: PixDevolutionCode;
  devolutionReason?: string;
  response: NotifyCreditValidationResponse;
  groupId?: string;
  createdAt?: Date;
}

export class NotifyCreditValidationEntity implements NotifyCreditValidation {
  id: string;
  initiationType: InitiationType;
  paymentPriorityType: PaymentPriorityType;
  paymentPriorityLevelType: PaymentPriorityLevelType;
  finalityType: number;
  agentModalityType?: PixAgentMod;
  ispbPss?: string;
  paymentInitiatorDocument?: string;
  thirdPartIspb: string;
  thirdPartPersonType: PersonType;
  thirdPartDocument: string;
  thirdPartName: string;
  thirdPartBranch?: string;
  thirdPartAccountType: AccountType;
  thirdPartAccountNumber: string;
  clientIspb: string;
  clientPersonType: PersonType;
  clientDocument: string;
  clientBranch?: string;
  clientAccountType: AccountType;
  clientAccountNumber: string;
  amount: number;
  amountDetails?: NotifyCreditValidationAmountDetails[];
  informationBetweenClients?: string;
  state?: NotifyCreditValidationState;
  endToEndId?: string;
  clientConciliationId?: string;
  key?: string;
  originalEndToEndId?: string;
  devolutionEndToEndId?: string;
  devolutionCode?: PixDevolutionCode;
  devolutionReason?: string;
  response: NotifyCreditValidationResponse;
  groupId?: string;
  createdAt?: Date;

  constructor(props: Partial<NotifyCreditValidation>) {
    Object.assign(this, props);
  }
}
