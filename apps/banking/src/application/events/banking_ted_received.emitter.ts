import { BankingTedReceived } from '@zro/banking/domain';

export type BankingTedReceivedEvent = Pick<
  BankingTedReceived,
  'id' | 'operation'
>;

export interface BankingTedReceivedEventEmitter {
  /**
   * Emit received event.
   * @param event Data.
   */
  receivedBankingTed: (event: BankingTedReceivedEvent) => void;
}
