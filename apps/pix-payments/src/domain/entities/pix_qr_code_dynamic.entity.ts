import { Domain } from '@zro/common';
import { User, PersonType } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';

export enum PixQrCodeDynamicState {
  PENDING = 'PENDING',
  READY = 'READY',
  ERROR = 'ERROR',
}

/**
 * QrCodeDynamic.
 */
export interface QrCodeDynamic extends Domain<string> {
  user: User;
  pixKey: PixKey;
  recipientCity?: string;
  documentValue?: number;
  recipientName?: string;
  recipientAddress?: string;
  recipientZipCode?: string;
  recipientFeredativeUnit?: string;
  recipientDocument?: string;
  recipientPersonType?: PersonType;
  summary?: string;
  description: string;
  payerName?: string;
  payerPersonType?: PersonType;
  payerDocument?: string;
  payerEmail?: string;
  payerCity?: string;
  payerPhone?: string;
  payerAddress?: string;
  dueDate?: Date;
  payerRequest?: string;
  allowUpdate?: boolean;
  allowUpdateChange?: boolean;
  allowUpdateWithdrawal?: boolean;
  expirationDate?: Date;
  state?: PixQrCodeDynamicState;
  emv?: string;
  paymentLinkUrl?: string;
  txId: string;
  externalId?: string;
  payloadJws?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class QrCodeDynamicEntity implements QrCodeDynamic {
  id: string;
  user: User;
  pixKey: PixKey;
  recipientCity?: string;
  documentValue?: number;
  recipientName?: string;
  recipientAddress?: string;
  recipientZipCode?: string;
  recipientFeredativeUnit?: string;
  recipientDocument?: string;
  recipientPersonType?: PersonType;
  summary?: string;
  description: string;
  payerName?: string;
  payerPersonType?: PersonType;
  payerDocument?: string;
  payerEmail?: string;
  payerCity?: string;
  payerPhone?: string;
  payerAddress?: string;
  dueDate?: Date;
  payerRequest?: string;
  allowUpdate?: boolean;
  allowUpdateChange?: boolean;
  allowUpdateWithdrawal?: boolean;
  expirationDate?: Date;
  state?: PixQrCodeDynamicState;
  emv?: string;
  paymentLinkUrl?: string;
  txId: string;
  externalId?: string;
  payloadJws?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<QrCodeDynamic>) {
    Object.assign(this, props);
  }
}
