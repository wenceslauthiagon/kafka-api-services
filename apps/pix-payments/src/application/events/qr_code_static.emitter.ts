import { QrCodeStatic } from '@zro/pix-payments/domain';

export type QrCodeStaticEvent = Pick<
  QrCodeStatic,
  'id' | 'user' | 'state' | 'txId' | 'expirationDate' | 'payableManyTimes'
>;

export interface QrCodeStaticEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorQrCodeStatic(event: QrCodeStaticEvent): void;

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyQrCodeStatic(event: QrCodeStaticEvent): void;

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingQrCodeStatic(event: QrCodeStaticEvent): void;

  /**
   * Emit deleted event.
   * @param event Data.
   */
  deletedQrCodeStatic(event: QrCodeStaticEvent): void;

  /**
   * Emit deleting event.
   * @param event Data.
   */
  deletingQrCodeStatic(event: QrCodeStaticEvent): void;
}
