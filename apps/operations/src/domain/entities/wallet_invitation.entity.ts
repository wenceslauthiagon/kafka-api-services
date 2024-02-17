import { Domain, getMoment } from '@zro/common';
import { User } from '@zro/users/domain';
import { PermissionType, Wallet } from '@zro/operations/domain';

export enum WalletInvitationState {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export interface WalletInvitation extends Domain<string> {
  user: User;
  wallet: Wallet;
  email: string;
  state: WalletInvitationState;
  permissionTypes: PermissionType[];
  confirmCode?: string;
  acceptedAt?: Date;
  declinedAt?: Date;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isExpiredWalletInvitation(): boolean;
  isAlreadyDeclinedWalletInvitation(): boolean;
  isAlreadyAcceptedWalletInvitation(): boolean;
  isAlreadyCanceledWalletInvitation(): boolean;
}

export class WalletInvitationEntity implements WalletInvitation {
  id: string;
  user: User;
  wallet: Wallet;
  email: string;
  state: WalletInvitationState;
  permissionTypes: PermissionType[];
  confirmCode?: string;
  acceptedAt?: Date;
  declinedAt?: Date;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: Partial<WalletInvitation>) {
    Object.assign(this, props);
  }

  isExpiredWalletInvitation(): boolean {
    return getMoment().isAfter(this.expiredAt);
  }

  isAlreadyDeclinedWalletInvitation(): boolean {
    return [WalletInvitationState.DECLINED].includes(this.state);
  }

  isAlreadyAcceptedWalletInvitation(): boolean {
    return [WalletInvitationState.ACCEPTED].includes(this.state);
  }

  isAlreadyCanceledWalletInvitation(): boolean {
    return [WalletInvitationState.CANCELED].includes(this.state);
  }
}
