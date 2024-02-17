import { Domain, Failed, getMoment } from '@zro/common';
import { User, PersonType } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import { DecodedPixKey } from '@zro/pix-keys/domain';
import {
  DecodedQrCode,
  DecodedPixAccount,
  PixAgentMod,
} from '@zro/pix-payments/domain';

export enum AccountType {
  CACC = 'CACC',
  CASH = 'CASH',
  CHAR = 'CHAR',
  CISH = 'CISH',
  COMM = 'COMM',
  CPAC = 'CPAC',
  LLSV = 'LLSV',
  LOAN = 'LOAN',
  MGLD = 'MGLD',
  MOMA = 'MOMA',
  NREX = 'NREX',
  ODFT = 'ODFT',
  ONDP = 'ONDP',
  OTHR = 'OTHR',
  SACC = 'SACC',
  SLRY = 'SLRY',
  SVGS = 'SVGS',
  TAXE = 'TAXE',
  TRAN = 'TRAN',
  TRAS = 'TRAS',
  CC = 'CC',
}

export enum PaymentState {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  SCHEDULED = 'SCHEDULED',
}

export enum PaymentType {
  ACCOUNT = 'ACCOUNT',
  KEY = 'KEY',
  QR_CODE = 'QR_CODE', // FIXME: It is deprecated.
  QR_CODE_STATIC_INSTANT = 'QR_CODE_STATIC_INSTANT',
  QR_CODE_STATIC_WITHDRAWAL = 'QR_CODE_STATIC_WITHDRAWAL',
  QR_CODE_DYNAMIC_DUE_DATE = 'QR_CODE_DYNAMIC_DUE_DATE',
  QR_CODE_DYNAMIC_WITHDRAWAL = 'QR_CODE_DYNAMIC_WITHDRAWAL',
  QR_CODE_DYNAMIC_CHANGE = 'QR_CODE_DYNAMIC_CHANGE',
  QR_CODE_DYNAMIC_INSTANT = 'QR_CODE_DYNAMIC_INSTANT',
}

export enum PaymentPriorityType {
  PRIORITY = 'PRIORITY',
  NOT_PRIORITY = 'NOT_PRIORITY',
}

export interface TPaymentRequestAccount {
  id: string;
  decodedPixAccountId: string;
  value: number;
  paymentDate?: Date;
  description?: string;
  userId: string;
  walletId: string;
}

export interface TPaymentRequestKey {
  id: string;
  decodedPixKeyId: string;
  value: number;
  paymentDate?: Date;
  description?: string;
  userId: string;
  walletId: string;
}

export interface TPaymentRequestQrCode {
  id: string;
  decodedQrCodeId: string;
  value?: number;
  paymentDate?: Date;
  description?: string;
  userId: string;
  walletId: string;
}

/**
 * PixPayment.
 */
export interface Payment extends Domain<string> {
  operation?: Operation;
  changeOperation?: Operation;
  state: PaymentState;
  value: number;
  endToEndId?: string;
  decodedQrCode?: DecodedQrCode;
  decodedPixKey?: DecodedPixKey;
  decodedPixAccount?: DecodedPixAccount;
  paymentDate?: Date;
  description?: string;
  txId?: string;
  key?: string;
  transactionTag: string;
  paymentType: PaymentType;
  priorityType: PaymentPriorityType;
  beneficiaryAccountType: AccountType;
  beneficiaryPersonType: PersonType;
  beneficiaryBranch: string;
  beneficiaryAccountNumber: string;
  beneficiaryBankName?: string;
  beneficiaryBankIspb: string;
  beneficiaryDocument: string;
  beneficiaryName?: string;
  agentMod?: PixAgentMod;
  agentIspb?: string;
  user: User;
  wallet: Wallet;
  ownerAccountNumber: string;
  ownerBranch: string;
  ownerDocument: string;
  ownerPersonType: PersonType;
  ownerFullName: string;
  chargebackReason?: string;
  failed?: Failed;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  canceledAt?: Date;
  isScheduledPayment(): boolean;
  isTodayPayment(): boolean;
  isAlreadyPaid(): boolean;
  hasReceipt(): boolean;
  isStateValidForCanceling(): boolean;
  isAlreadyCompletedPayment(): boolean;
}

export class PaymentEntity implements Payment {
  id!: string;
  operation?: Operation;
  changeOperation?: Operation;
  state: PaymentState;
  value: number;
  endToEndId?: string;
  decodedQrCode?: DecodedQrCode;
  decodedPixKey?: DecodedPixKey;
  decodedPixAccount?: DecodedPixAccount;
  paymentDate?: Date;
  description?: string;
  txId?: string;
  key?: string;
  transactionTag: string;
  paymentType: PaymentType;
  priorityType: PaymentPriorityType;
  beneficiaryAccountType: AccountType;
  beneficiaryPersonType: PersonType;
  beneficiaryBranch: string;
  beneficiaryAccountNumber: string;
  beneficiaryBankName?: string;
  beneficiaryBankIspb: string;
  beneficiaryDocument: string;
  beneficiaryName?: string;
  agentMod?: PixAgentMod;
  agentIspb?: string;
  user: User;
  wallet: Wallet;
  ownerAccountNumber: string;
  ownerBranch: string;
  ownerDocument: string;
  ownerPersonType: PersonType;
  ownerFullName: string;
  chargebackReason?: string;
  failed?: Failed;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  canceledAt?: Date;

  constructor(props: Partial<Payment>) {
    Object.assign(this, props);
  }

  isScheduledPayment(): boolean {
    return (
      getMoment(this.paymentDate).isAfter(getMoment(), 'day') &&
      getMoment(this.paymentDate).isSameOrBefore(
        getMoment().add(3, 'month'),
        'day',
      )
    );
  }

  isTodayPayment(): boolean {
    return (
      !this.paymentDate ||
      getMoment(this.paymentDate).isSame(getMoment(), 'day')
    );
  }

  isAlreadyPaid(): boolean {
    return [PaymentState.WAITING, PaymentState.CONFIRMED].includes(this.state);
  }

  hasReceipt(): boolean {
    return [PaymentState.SCHEDULED, PaymentState.CONFIRMED].includes(
      this.state,
    );
  }

  isStateValidForCanceling(): boolean {
    return PaymentState.SCHEDULED === this.state;
  }

  isAlreadyCompletedPayment(): boolean {
    return PaymentState.CONFIRMED === this.state;
  }
}
