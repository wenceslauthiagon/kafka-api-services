import { NotifyCompletion } from '@zro/api-topazio/domain';

export type NotifyCompletionEvent = Pick<
  NotifyCompletion,
  'id' | 'state' | 'transactionId'
>;

export interface NotifyCompletionEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCompletion: (event: NotifyCompletionEvent) => void;
}
