import { AdminBankingTed } from '@zro/banking/domain';

export type GetAdminBankingTedByTransactionIdResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export type RejectAdminBankingTedResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export type ForwardAdminBankingTedResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export interface AdminBankingService {
  /**
   * Get admin banking ted by transactionId (ID for bankingTed is differ than transactionId in PSP).
   * @param transactionId The id of transaction received by psp.
   * @returns AdminBankingTed.
   */
  getAdminBankingTedByTransactionId(
    transactionId: string,
  ): Promise<GetAdminBankingTedByTransactionIdResponse>;

  /**
   * Create a rejected AdminBankingTed.
   * @param id String.
   * @param code String.
   * @param message String.
   * @returns AdminBankingTed.
   */
  rejectAdminBankingTed(
    id: string,
    code: string,
    message: string,
  ): Promise<RejectAdminBankingTedResponse>;

  /**
   * Create a forward AdminBankingTed.
   * @param id String.
   * @returns AdminBankingTed.
   */
  forwardAdminBankingTed(id: string): Promise<ForwardAdminBankingTedResponse>;
}
