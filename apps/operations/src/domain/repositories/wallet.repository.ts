import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';

export interface WalletRepository {
  /**
   * Create a wallet.
   *
   * @param wallet Wallet to be created.
   * @returns Created wallet.
   */
  create(wallet: Wallet): Promise<Wallet>;

  /**
   * Update wallet.
   *
   * @param wallet Wallet.
   * @returns Wallet updated.
   */
  update(wallet: Wallet): Promise<Wallet>;

  /**
   * Delete wallet.
   *
   * @param wallet Wallet.
   * @returns Wallet deleted.
   */
  delete(wallet: Wallet): Promise<number>;

  /**
   * Get wallet by uuid.
   *
   * @param uuid Wallet uuid.
   * @returns Wallet found or null otherwise.
   */
  getByUuid(uuid: string): Promise<Wallet>;

  /**
   * Count wallets by user.
   *
   * @param user Wallet owner.
   * @returns number.
   */
  countByUserAndStateIsNotDeactivate(user: User): Promise<number>;

  /**
   * Get default wallet by user.
   *
   * @param user Wallet owner.
   * @returns Wallet found or null otherwise.
   */
  getByUserAndDefaultIsTrue(user: User): Promise<Wallet>;

  /**
   * Get all wallets by user.
   *
   * @param user User.
   * @returns Wallet[].
   */
  getAllByUser(user: User): Promise<Wallet[]>;
}
