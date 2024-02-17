import { NotifyConfirmBankingTed } from '@zro/api-topazio/domain';

export type NotifyConfirmBankingTedEvent = Pick<
  NotifyConfirmBankingTed,
  'id' | 'state' | 'transactionId'
>;

export interface NotifyConfirmBankingTedEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyConfirmBankingTed: (event: NotifyConfirmBankingTedEvent) => void;
}
