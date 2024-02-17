import { NotifyCredit } from '@zro/api-topazio/domain';

export type NotifyCreditEvent = Pick<
  NotifyCredit,
  'id' | 'state' | 'transactionId'
>;

export interface NotifyCreditEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCredit: (event: NotifyCreditEvent) => void;
}
