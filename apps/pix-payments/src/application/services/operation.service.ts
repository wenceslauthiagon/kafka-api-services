import {
  Currency,
  Operation,
  Wallet,
  WalletAccount,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  AcceptOperationResponse,
  CreateOperationResponse,
  RevertOperationResponse,
  SetOperationReferenceByIdResponse,
  CreateAndAcceptOperationResponse,
} from '@zro/operations/interface';

export interface OperationService {
  /**
   * Create operation.
   * @param operation Data for construct operation.
   * @param transactionTag String for construct operation.
   * @returns Operation created.
   */
  createOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
    ownerAllowAvailableRawValue?: boolean,
  ): Promise<CreateOperationResponse>;

  /**
   * Accept operation.
   * @param operation The operation.
   * @returns Accepted operation.
   */
  acceptOperation(operation: Operation): Promise<AcceptOperationResponse>;

  /**
   * Create ond accept peration.
   * @param operation Data for construct operation.
   * @param transactionTag String for construct operation.
   * @returns Operation created.
   */
  createAndAcceptOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
    ownerAllowAvailableRawValue?: boolean,
  ): Promise<CreateAndAcceptOperationResponse>;

  /**
   * Get operation by id.
   * @param id The operation's id.
   * @returns The operation.
   */
  getOperationById(id: string): Promise<Operation>;

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
   * Revert operation.
   * @param operation The operation.
   * @returns Operation reverted.
   */
  revertOperation(operation: Operation): Promise<RevertOperationResponse>;

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
   * Get default wallet by user.
   * @param user Data for construct param.
   * @returns Wallet.
   */
  getWalletByUserAndDefaultIsTrue(user: User): Promise<Wallet>;

  /**
   * Set operation reference in microservice.
   * @param operationFisrt The operation.
   * @param operationSecond The operation.
   * @returns The referenced operations.
   */
  setOperationReference(
    operationFisrt: Operation,
    operationSecond: Operation,
  ): Promise<SetOperationReferenceByIdResponse>;
}
