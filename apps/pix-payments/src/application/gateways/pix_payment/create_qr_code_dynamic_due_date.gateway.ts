import { PixAgentMod } from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';

export interface CreateQrCodeDynamicDueDatePixPaymentPspRequest {
  qrCodeDynamicId: string;
  key: string;
  documentValue: number;
  description: string;
  recipientCity: string;
  recipientName: string;
  recipientAddress: string;
  recipientZipCode: string;
  recipientFeredativeUnit: string;
  recipientDocument: string;
  recipientPersonType: PersonType;
  txId: string;
  payerCity?: string;
  payerPersonType: PersonType;
  payerDocument: string;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  payerAddress?: string;
  dueDate?: Date;
  receivableAfterDueDate?: Date;
  interestDate?: Date;
  dailyInterestValue?: number;
  fineDate?: Date;
  fineValue?: number;
  discountMaxDate?: Date;
  discountValue?: number;
  payerRequest?: string;
  valueModifiable?: boolean;
  expirationDate?: Date;
  withValue?: number;
  allowUpdateWithdrawal?: boolean;
  agentIspbWithdrawal?: string;
  agentModWithdrawal?: PixAgentMod;
  changeValue?: number;
  allowUpdateChange?: boolean;
  agentIspbChange?: string;
  agentModChange?: PixAgentMod;
}

export interface CreateQrCodeDynamicDueDatePixPaymentPspResponse {
  emv: string;
  paymentLinkUrl?: string;
  payloadJws?: string;
  externalId?: string;
}

export interface CreateQrCodeDynamicDueDatePixPaymentPspGateway {
  createQrCodeDynamicDueDate(
    request: CreateQrCodeDynamicDueDatePixPaymentPspRequest,
  ): Promise<CreateQrCodeDynamicDueDatePixPaymentPspResponse>;
}
