import { NotifyConfirmBankingTed } from '@zro/api-topazio/domain';
import { BankingTed } from '@zro/banking/domain';

export type GetBankingTedByTransactionIdResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export type RejectBankingTedResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export type ForwardBankingTedResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export type ConfirmBankingTedResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export interface BankingService {
  /**
   * Get banking ted by transactionId (ID for bankingTed is differ than transactionId in PSP).
   * @param transactionId The id of transaction received by psp.
   * @returns BankingTed.
   */
  getBankingTedByTransactionId(
    transactionId: string,
  ): Promise<GetBankingTedByTransactionIdResponse>;

  /**
   * Create a confirm BankingTed.
   * @param payload NotifyConfirmBankingTed.
   * @returns BankingTed.
   */
  confirmBankingTed(
    payload: NotifyConfirmBankingTed,
  ): Promise<ConfirmBankingTedResponse>;

  /**
   * Create a rejected BankingTed.
   * @param id Number.
   * @param code String.
   * @param message String.
   * @returns BankingTed.
   */
  rejectBankingTed(
    id: number,
    code: string,
    message: string,
  ): Promise<RejectBankingTedResponse>;

  /**
   * Create a forward BankingTed.
   * @param id Number.
   * @returns BankingTed.
   */
  forwardBankingTed(id: number): Promise<ForwardBankingTedResponse>;
}
