import { NotifyDebit } from '@zro/api-topazio/domain';

export type NotifyDebitEvent = Pick<
  NotifyDebit,
  'id' | 'state' | 'transactionId'
>;

export interface NotifyDebitEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyDebit: (event: NotifyDebitEvent) => void;
}
