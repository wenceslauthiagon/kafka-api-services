import {
  Currency,
  Operation,
  Wallet,
  WalletAccount,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export interface OperationService {
  /**
   * Create ond accept peration.
   * @param transactionTag String for construct operation.
   * @param operation Data for construct operation.
   * @param wallet Data for construct param.
   * @returns Operation created.
   */
  createAndAcceptOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
  ): Promise<void>;

  /**
   * Get default wallet by user.
   * @param user Data for construct param.
   * @returns Wallet.
   */
  getWalletByUserAndDefaultIsTrue(user: User): Promise<Wallet>;

  /**
   * Get Wallet Account.
   * @param wallet Data for construct param.
   * @param currency Data for construct param.
   * @returns Wallet Account.
   */
  getWalletAccountByWalletAndCurrency(
    wallet: Wallet,
    currency: Currency,
  ): Promise<WalletAccount>;

  /**
   * Get account number and currency wallet account.
   * @param accountNumber The account number.
   * @param currency Data for construct param.
   * @returns The wallet account and account number.
   */
  getWalletAccountByAccountNumberAndCurrency(
    accountNumber: string,
    currency: Currency,
  ): Promise<WalletAccount>;

  /**
   * Revert operation.
   * @param operation The operation.
   * @returns Operation reverted.
   */
  revertOperation(operation: Operation): Promise<void>;

  /**
   * Get operation by id.
   * @param id The operation's id.
   * @returns The operation.
   */
  getOperationById(id: string): Promise<Operation>;
}
