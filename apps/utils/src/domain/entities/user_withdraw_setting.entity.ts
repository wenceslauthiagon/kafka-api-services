import { Domain } from '@zro/common';
import { TransactionType, Wallet } from '@zro/operations/domain';
import { PixKey } from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';

export enum WithdrawSettingState {
  ACTIVE = 'ACTIVE',
  DEACTIVE = 'DEACTIVE',
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

export interface UserWithdrawSetting extends Domain<string> {
  state: WithdrawSettingState;
  wallet: Wallet;
  user: User;
  transactionType: TransactionType;
  pixKey: PixKey;
  type: WithdrawSettingType;
  balance: number;
  day?: number;
  weekDay?: WithdrawSettingWeekDays;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class UserWithdrawSettingEntity implements UserWithdrawSetting {
  id: string;
  state: WithdrawSettingState;
  wallet: Wallet;
  user: User;
  transactionType: TransactionType;
  pixKey: PixKey;
  type: WithdrawSettingType;
  balance: number;
  day?: number;
  weekDay?: WithdrawSettingWeekDays;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(props: Partial<UserWithdrawSetting>) {
    Object.assign(this, props);
  }
}
