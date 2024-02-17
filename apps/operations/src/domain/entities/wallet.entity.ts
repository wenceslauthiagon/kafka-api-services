import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export enum WalletState {
  PENDING = 'pending',
  ACTIVE = 'active',
  DEACTIVATE = 'deactivate',
}

/**
 * User wallet.
 */
export interface Wallet extends Domain<number> {
  uuid: string;
  user: User;
  name: string;
  state: WalletState;
  default: boolean;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Check if wallet is active.
   * @returns True if wallet is active or false otherwise.
   */
  isActive: () => boolean;
}

export class WalletEntity implements Wallet {
  id?: number;
  uuid: string;
  user: User;
  name: string;
  state: WalletState;
  default: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<Wallet>) {
    Object.assign(this, props);
  }

  isActive(): boolean {
    return this.state === WalletState.ACTIVE;
  }
}
