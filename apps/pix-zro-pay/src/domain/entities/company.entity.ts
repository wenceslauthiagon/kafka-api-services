import { Domain } from '@zro/common';
import { BankAccount, Plan, User } from '@zro/pix-zro-pay/domain';

/**
 * Company.
 */
export interface Company extends Domain<number> {
  name: string;
  tradingName: string;
  cnpj: string;
  ie?: string;
  phone?: string;
  matrix?: Company;
  plan: Plan;
  responsible?: User;
  webhookTransaction?: string;
  webhookWithdraw?: string;
  xApiKey?: string;
  identifier?: string;
  isRetailer?: boolean;
  requireClientDocument?: boolean;
  phoneNumber?: string;
  activeBankForCashIn?: BankAccount;
  activeBankForCashOut?: BankAccount;
  zroUserId?: string;
  zroUserKey?: string;
  pixKeyType?: string;
  pixKey?: string;
  showQrCodeInfoToPayer?: boolean;
  email?: string;
  webhookRefund?: string;
  webhookKyc?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class CompanyEntity implements Company {
  id: number;
  name: string;
  tradingName: string;
  cnpj: string;
  ie?: string;
  phone?: string;
  matrix?: Company;
  plan: Plan;
  responsible?: User;
  webhookTransaction?: string;
  webhookWithdraw?: string;
  xApiKey?: string;
  identifier?: string;
  isRetailer?: boolean = false;
  requireClientDocument?: boolean = false;
  phoneNumber?: string;
  activeBankForCashIn?: BankAccount;
  activeBankForCashOut?: BankAccount;
  zroUserId?: string;
  zroUserKey?: string;
  pixKeyType?: string;
  pixKey?: string;
  showQrCodeInfoToPayer?: boolean;
  email?: string;
  webhookRefund?: string;
  webhookKyc?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(props: Partial<Company>) {
    Object.assign(this, props);
  }
}
