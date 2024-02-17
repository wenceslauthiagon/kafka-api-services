import { User } from '@zro/users/domain';
import { Currency, Operation, Wallet } from '@zro/operations/domain';

export interface OperationService {
  /**
   * Call Operations for getting operation by id.
   * @param operation The operation.
   * @returns Operation if found or null otherwise.
   */
  getOperationById(operation: Operation): Promise<Operation>;

  /**
   * Call Operations for getting currency by id.
   * @param currency The currency.
   * @returns Currency if found or null otherwise.
   */
  getCurrencyById(currency: Currency): Promise<Currency>;

  /**
   * Call Operations for getting currency by symbol.
   * @param symbol The currency symbol.
   * @returns Currency if found or null otherwise.
   */
  getCurrencyBySymbol(symbol: string): Promise<Currency>;

  /**
   * Get default wallet by user.
   * @param user Data for construct param.
   * @returns Wallet.
   */
  getWalletByUserAndDefaultIsTrue(user: User): Promise<Wallet>;

  /**
   * Get wallet by uuid.
   * @param walletUuid  construct param.
   * @returns Wallet.
   */
  getWalletByUuid(walletUuid: string): Promise<Wallet>;
}
