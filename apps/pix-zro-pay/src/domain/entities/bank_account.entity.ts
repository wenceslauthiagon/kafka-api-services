import { Domain } from '@zro/common';

export enum BankAccountName {
  BANK_GENIAL = 'Banco Genial',
  BANK_ZRO_BANK = 'Zro Bank',
  BANK_BS2 = 'Banco BS2',
  BANK_ASAAS = 'Banco Asaas',
}
/**
 * BankAccount.
 */
export interface BankAccount extends Domain<number> {
  agency: string;
  accountNumber: string;
  cpfCnpj: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  pixKeyType?: string;
  pixKey?: string;
  name?: BankAccountName;
  slug?: string;
  refundCpf?: boolean;
}

export class BankAccountEntity implements BankAccount {
  id: number;
  agency: string;
  accountNumber: string;
  cpfCnpj: string;
  pixKeyType?: string;
  pixKey?: string;
  name?: BankAccountName;
  slug?: string;
  refundCpf?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(props: Partial<BankAccount>) {
    Object.assign(this, props);
  }
}
