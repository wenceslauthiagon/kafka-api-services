import { NotifyRegisterBankingTed } from '@zro/api-topazio/domain';

export type NotifyRegisterBankingTedEvent = Pick<
  NotifyRegisterBankingTed,
  'id' | 'state' | 'transactionId'
>;

export interface NotifyRegisterBankingTedEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyRegisterBankingTed: (event: NotifyRegisterBankingTedEvent) => void;
}
