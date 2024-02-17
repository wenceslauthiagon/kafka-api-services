import { Domain, getMoment } from '@zro/common';
import { PersonType, User } from '@zro/users/domain';
import { AccountType, PixAgentMod } from '@zro/pix-payments/domain';

export enum DecodedQrCodeState {
  PENDING = 'PENDING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export enum DecodedQrCodeType {
  QR_CODE_STATIC_INSTANT_PAYMENT = 'QR_CODE_STATIC_INSTANT_PAYMENT',
  QR_CODE_STATIC_WITHDRAWAL = 'QR_CODE_STATIC_WITHDRAWAL',
  QR_CODE_DYNAMIC_DUE_DATE = 'QR_CODE_DYNAMIC_DUE_DATE',
  QR_CODE_DYNAMIC_WITHDRAWAL = 'QR_CODE_DYNAMIC_WITHDRAWAL',
  QR_CODE_DYNAMIC_CHANGE = 'QR_CODE_DYNAMIC_CHANGE',
  QR_CODE_DYNAMIC_INSTANT_PAYMENT = 'QR_CODE_DYNAMIC_INSTANT_PAYMENT',
}

export interface DecodedQrCodeAdditionalInfo {
  name: string;
  value: string;
}

/**
 * DecodedQrCode.
 */
export interface DecodedQrCode extends Domain<string> {
  emv: string;
  document?: string;
  cityCode?: string;
  paymentDate?: Date;
  key: string;
  txId: string;
  documentValue: number;
  additionalInfo?: string;
  recipientName: string;
  recipientPersonType: PersonType;
  recipientDocument: string;
  recipientIspb: string;
  recipientBranch: string;
  recipientAccountType: AccountType;
  recipientAccountNumber: string;
  recipientCity: string;
  endToEndId?: string;
  type: DecodedQrCodeType;
  allowUpdate: boolean;
  paymentValue?: number;
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
  state: DecodedQrCodeState;
  user: User;
  recipientBankName: string;
  recipientBankIspb: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  agentIspbWithdrawal?: string;
  agentModWithdrawal?: PixAgentMod;
  agentIspbChange?: string;
  agentModChange?: PixAgentMod;
  isExpiredQrCode(): boolean;
}

export class DecodedQrCodeEntity implements DecodedQrCode {
  id: string;
  emv: string;
  document?: string;
  cityCode?: string;
  paymentDate?: Date;
  key: string;
  txId: string;
  documentValue: number;
  additionalInfo?: string;
  recipientName: string;
  recipientPersonType: PersonType;
  recipientDocument: string;
  recipientIspb: string;
  recipientBranch: string;
  recipientAccountType: AccountType;
  recipientAccountNumber: string;
  recipientCity: string;
  endToEndId?: string;
  type: DecodedQrCodeType;
  allowUpdate: boolean;
  paymentValue?: number;
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
  state: DecodedQrCodeState;
  user: User;
  recipientBankName: string;
  recipientBankIspb: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  agentIspbWithdrawal?: string;
  agentModWithdrawal?: PixAgentMod;
  agentIspbChange?: string;
  agentModChange?: PixAgentMod;

  constructor(props: Partial<DecodedQrCode>) {
    Object.assign(this, props);
  }

  isExpiredQrCode(): boolean {
    return getMoment(this.expirationDate).isBefore(getMoment(), 'day');
  }
}
