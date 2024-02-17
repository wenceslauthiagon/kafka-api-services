import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  PaymentPriorityType,
  PaymentType,
  PixAgentMod,
} from '@zro/pix-payments/domain';

export interface CreatePaymentPixPaymentPspRequest {
  paymentId: string;
  value: number;
  description?: string;
  ownerBranch: string;
  ownerAccountNumber: string;
  ownerName: string;
  ownerPersonType: PersonType;
  ownerDocument: string;
  beneficiaryKey?: string;
  beneficiaryBankIspb: string;
  beneficiaryBranch: string;
  beneficiaryAccountType: AccountType;
  beneficiaryAccountNumber: string;
  beneficiaryName?: string;
  beneficiaryPersonType: PersonType;
  beneficiaryDocument: string;
  txId?: string;
  agentMod?: PixAgentMod;
  agentIspb?: string;
  createdAt: Date;
  paymentType: PaymentType;
  priorityType: PaymentPriorityType;
  ispb: string;
  endToEndId?: string;
}

export interface CreatePaymentPixPaymentPspResponse {
  externalId: string;
  endToEndId?: string;
}

export interface CreatePaymentPixPaymentPspGateway {
  createPayment(
    request: CreatePaymentPixPaymentPspRequest,
  ): Promise<CreatePaymentPixPaymentPspResponse>;
}
