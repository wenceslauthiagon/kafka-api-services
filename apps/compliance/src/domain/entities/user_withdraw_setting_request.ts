import { Domain } from '@zro/common';
import { TransactionType, Wallet } from '@zro/operations/domain';
import { DecodedPixKey, PixKey } from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';

export enum UserWithdrawSettingRequestState {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FAILED = 'FAILED',
}

export enum UserWithdrawSettingRequestAnalysisResultType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum WithdrawSettingType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  BALANCE = 'BALANCE',
}

export enum WithdrawSettingWeekDays {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export interface UserWithdrawSettingRequest extends Domain<string> {
  state: UserWithdrawSettingRequestState;
  analysisResult?: UserWithdrawSettingRequestAnalysisResultType;
  wallet: Wallet;
  user: User;
  transactionType: TransactionType;
  pixKey: PixKey;
  decodedPixKey?: DecodedPixKey;
  type: WithdrawSettingType;
  balance: number;
  day?: number;
  weekDay?: WithdrawSettingWeekDays;
  issueId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  closedAt?: Date;
}

export class UserWithdrawSettingRequestEntity
  implements UserWithdrawSettingRequest
{
  id: string;
  state: UserWithdrawSettingRequestState;
  analysisResult?: UserWithdrawSettingRequestAnalysisResultType;
  wallet: Wallet;
  user: User;
  transactionType: TransactionType;
  pixKey: PixKey;
  decodedPixKey?: DecodedPixKey;
  type: WithdrawSettingType;
  balance: number;
  day?: number;
  weekDay?: WithdrawSettingWeekDays;
  issueId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  closedAt?: Date;

  constructor(props: Partial<UserWithdrawSettingRequest>) {
    Object.assign(this, props);
  }
}
