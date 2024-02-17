import { DecodedPixAccount } from '@zro/pix-payments/domain';

export type DecodedPixAccountEvent = Pick<
  DecodedPixAccount,
  'id' | 'user' | 'state' | 'name' | 'tradeName'
>;

export interface DecodedPixAccountEventEmitter {
  /**
   * Emit pending payment event.
   * @param event Data.
   */
  pendingDecodedPixAccount(event: DecodedPixAccountEvent): void;

  /**
   * Emit confirmed payment event.
   * @param event Data.
   */
  confirmedDecodedPixAccount(event: DecodedPixAccountEvent): void;
}
