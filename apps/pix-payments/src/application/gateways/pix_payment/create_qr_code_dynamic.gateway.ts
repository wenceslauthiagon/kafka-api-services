import { PixAgentMod } from '@zro/pix-payments/domain';

export interface CreateQrCodeDynamicPixPaymentPspRequest {
  qrCodeDynamicId: string;
  key: string;
  recipientCity: string;
  documentValue: number;
  description: string;
  recipientName: string;
  txId: string;
  payerCity?: string;
  payerPersonType?: string;
  payerDocument?: string;
  payerName?: string;
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

export interface CreateQrCodeDynamicPixPaymentPspResponse {
  emv: string;
  paymentLinkUrl?: string;
  payloadJws?: string;
  externalId?: string;
}

export interface CreateQrCodeDynamicPixPaymentPspGateway {
  createQrCodeDynamic(
    request: CreateQrCodeDynamicPixPaymentPspRequest,
  ): Promise<CreateQrCodeDynamicPixPaymentPspResponse>;
}
