import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  DecodedQrCodeAdditionalInfo,
  DecodedQrCodeType,
  PixAgentMod,
} from '@zro/pix-payments/domain';

export interface DecodeQrCodePixPaymentPspRequest {
  emv: string;
  decodedQrCodeId: string;
  document: string;
  paymentDate?: Date;
}

export interface DecodeQrCodePixPaymentPspResponse {
  key: string;
  txId: string;
  documentValue: number;
  additionalInfo: string;
  recipientName: string;
  recipientPersonType: PersonType;
  recipientDocument: string;
  recipientIspb: string;
  recipientBranch: string;
  recipientAccountType: AccountType;
  recipientAccountNumber: string;
  recipientCity: string;
  endToEndId: string;
  type: DecodedQrCodeType;
  paymentValue?: number;
  allowUpdate: boolean;
  pss?: string;
  expirationDate?: Date;
  payerPersonType?: PersonType;
  payerDocument?: string;
  payerName?: string;
  status?: string;
  version?: string;
  additionalInfos?: DecodedQrCodeAdditionalInfo[];
  withdrawValue?: number;
  changeValue?: number;
  dueDate?: Date;
  interestValue?: number;
  fineValue?: number;
  deductionValue?: number;
  discountValue?: number;
  agentIspbWithdrawal: string;
  agentModWithdrawal: PixAgentMod;
  agentIspbChange: string;
  agentModChange: PixAgentMod;
}

export interface DecodeQrCodePixPaymentPspGateway {
  decodeQrCode(
    request: DecodeQrCodePixPaymentPspRequest,
  ): Promise<DecodeQrCodePixPaymentPspResponse>;
}
