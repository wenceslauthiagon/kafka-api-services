import { NotifyClaim } from '@zro/api-topazio/domain';

export type NotifyClaimEvent = Pick<NotifyClaim, 'id' | 'state'> & {
  requestId?: string;
};

export interface NotifyClaimEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyClaim: (event: NotifyClaimEvent) => void;
}
