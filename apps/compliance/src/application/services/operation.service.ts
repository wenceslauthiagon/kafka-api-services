import {
  Operation,
  TransactionType,
  UserWallet,
  Wallet,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export type GetOperationByIdResponse = Pick<
  Operation,
  'id' | 'state' | 'value'
>;

export interface OperationService {
  /**
   * Get an operation by id.
   * @param id operation id.
   * @returns operation found otherwise null.
   */
  getOperationById(id: string): Promise<GetOperationByIdResponse>;

  /**
   * Get a transaction type by tag.
   * @param tag transaction type tag.
   * @returns transaction type found or null otherwise.
   */
  getTransactionTypeByTag(tag: string): Promise<TransactionType>;

  /**
   * Get a user wallet by user and wallet.
   * @param user user.
   * @param uuid wallet.
   * @returns User Wallet if found or null otherwise.
   */
  getUserWalletByUserAndWallet(user: User, wallet: Wallet): Promise<UserWallet>;

  /**
   * Get a wallet by uuid.
   * @param uuid wallet uuid.
   * @returns Wallet if found or null otherwise.
   */
  getWalletByUuid(uuid: string): Promise<Wallet>;
}
