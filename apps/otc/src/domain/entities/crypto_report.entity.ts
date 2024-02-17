import { Domain } from '@zro/common';
import {
  Currency,
  Operation,
  Wallet,
  WalletAccount,
} from '@zro/operations/domain';
import { Conversion, OperationBtcReceive } from '@zro/otc/domain';
import { User } from '@zro/users/domain';

export enum CryptoReportType {
  BUY = 'buy',
  SELL = 'sell',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdraw',
  CASHBACK = 'cashback',
}

export enum CryptoReportFormatType {
  PDF = 'pdf',
  XLSX = 'xlsx',
}

export interface CryptoReport extends Domain<string> {
  type: CryptoReportType;
  cryptoAmount: number;
  cryptoPrice?: number;
  accuratePrice?: boolean;
  fiatAmount?: number;
  avgPrice?: number;
  cryptoBalance?: number;
  profit?: number;
  loss?: number;
  profitLossPercentage?: number;
  user: User;
  crypto: Currency;
  conversion?: Conversion;
  operation?: Operation;
  operationBtcReceive?: OperationBtcReceive;
  walletAccount: WalletAccount;
  wallet: Wallet;
  createdAt: Date;
  updatedAt: Date;
  isTypeBeneficiary(): boolean;
}

export class CryptoReportEntity implements CryptoReport {
  id: string;
  type: CryptoReportType;
  cryptoAmount: number;
  cryptoPrice?: number;
  accuratePrice?: boolean;
  fiatAmount?: number;
  avgPrice?: number;
  cryptoBalance?: number;
  profit?: number;
  loss?: number;
  profitLossPercentage?: number;
  user: User;
  crypto: Currency;
  conversion?: Conversion;
  operation?: Operation;
  operationBtcReceive?: OperationBtcReceive;
  walletAccount: WalletAccount;
  wallet: Wallet;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<CryptoReport>) {
    Object.assign(this, props);
  }

  isTypeBeneficiary(): boolean {
    return [
      CryptoReportType.BUY,
      CryptoReportType.DEPOSIT,
      CryptoReportType.CASHBACK,
    ].includes(this.type);
  }
}
