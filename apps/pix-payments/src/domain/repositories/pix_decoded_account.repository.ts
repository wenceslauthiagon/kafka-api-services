import { DecodedPixAccount } from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';
import { Bank } from '@zro/banking/domain';
export interface DecodedPixAccountRepository {
  /**
   * Insert a DecodedPixAccount.
   * @param decodedPixAccount DecodedPixAccount to save.
   * @returns Created DecodedPixAccount.
   */
  create: (decodedPixAccount: DecodedPixAccount) => Promise<DecodedPixAccount>;

  /**
   * Search by DecodedPixAccount ID.
   * @param id DecodedPixAccount ID.
   * @return DecodedPixAccount found.
   */
  getById: (id: string) => Promise<DecodedPixAccount>;

  /**
   * Search by DecodedPixAccount document.
   * @param document DecodedPixAccount document.
   * @return DecodedPixAccount found.
   */
  getByDocumentAndAccountAndBranch: (
    document: string,
    accountNumber: string,
    branch: string,
  ) => Promise<DecodedPixAccount>;

  /**
   * Search by DecodedPixAccount user, bank, account, branch.
   * @param user DecodedPixAccount request user.
   * @param bank Third party bank code.
   * @param accountNumber Third party account number.
   * @param branch Third party branch number.
   * @return DecodedPixAccount found.
   */
  getByUserAndBankAndAccountAndBranch: (
    user: User,
    bank: Bank,
    accountNumber: string,
    branch: string,
  ) => Promise<DecodedPixAccount>;

  /**
   * Search by DecodedPixAccount user, bank, account, branch.
   * @param user DecodedPixAccount request user.
   * @return Number of DecodedPixAccount found.
   */
  countByUserAndStatePendingLast24Hours: (user: User) => Promise<number>;

  /**
   * Update a DecodedPixAccount.
   * @param decodedPixAccount DecodedPixAccount to update.
   * @returns Updated decodedPixAccount.
   */
  update: (decodedPixAccount: DecodedPixAccount) => Promise<DecodedPixAccount>;
}
