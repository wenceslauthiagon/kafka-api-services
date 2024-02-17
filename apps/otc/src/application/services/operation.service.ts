import { User } from '@zro/users/domain';
import {
  Currency,
  LimitType,
  Operation,
  UserLimit,
  Wallet,
  WalletAccount,
} from '@zro/operations/domain';
import {
  AcceptOperationResponse,
  CreateAndAcceptOperationResponse,
  CreateOperationResponse,
} from '@zro/operations/interface';

export interface OperationService {
  /**
   * Get all active Currencies.
   * @returns Currencies.
   */
  getAllActiveCurrencies: () => Promise<Currency[]>;

  /**
   * Insert a Currency.
   * @param currency Currency to save.
   * @returns Created currency.
   */
  createCurrency: (currency: Currency) => Promise<Currency>;

  /**
   * Get Currency by tag.
   * @param tag The Currency's tag.
   * @returns Currency if found or null otherwise.
   */
  getCurrencyByTag(tag: string): Promise<Currency>;

  /**
   * Get Currency by symbol.
   * @param symbol The Currency's symbol.
   * @returns Currency if found or null otherwise.
   */
  getCurrencyBySymbol(symbol: string): Promise<Currency>;

  /**
   * Get currency by id.
   * @param id The currency's id.
   * @returns Currency if found or null otherwise.
   */
  getCurrencyById(id: number): Promise<Currency>;

  /**
   * Create operation.
   * @param wallet Data for construct param.
   * @param operation Data for construct operation.
   * @param transactionTag String for construct operation.
   * @returns Operation created.
   */
  createOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
  ): Promise<CreateOperationResponse>;

  /**
   * Accept operation.
   * @param operation The operation.
   * @returns Accepted operation.
   */
  acceptOperation(operation: Operation): Promise<AcceptOperationResponse>;

  /**
   * Create ond accept peration.
   * @param wallet Data for construct param.
   * @param operationOwner Data for construct operation.
   * @param operationBeneficiary Data for construct operation.
   * @param transactionTag String for construct operation.
   * @returns Operation created.
   */
  createAndAcceptOperation(
    transactionTag: string,
    operationOwner?: Operation,
    operationBeneficiary?: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
  ): Promise<CreateAndAcceptOperationResponse>;

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
   * Get Limit types in microservice.
   * @param transactionTypeTag Data for construct param.
   * @returns Limit Types.
   */
  getLimitTypesByFilter(transactionTypeTag: string): Promise<LimitType[]>;

  /**
   * Get User Limit in microservice.
   * @param limitType Limit type.
   * @param user User.
   * @returns User Limit.
   */
  getUserLimitsByFilter(limitType: LimitType, user: User): Promise<UserLimit[]>;

  /**
   * Get Wallets by user.
   * @param user User.
   * @returns Wallets of user.
   */
  getWalletsByUser(user: User): Promise<Wallet[]>;

  /**
   * Get default wallet by user.
   * @param user Data for construct param.
   * @returns Wallet.
   */
  getWalletByUserAndDefaultIsTrue(user: User): Promise<Wallet>;
}
