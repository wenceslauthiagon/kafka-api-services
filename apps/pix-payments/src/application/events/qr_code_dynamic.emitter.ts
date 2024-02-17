import { QrCodeDynamic } from '@zro/pix-payments/domain';

export type QrCodeDynamicEvent = Pick<
  QrCodeDynamic,
  'id' | 'user' | 'state' | 'txId' | 'expirationDate'
>;

export interface QrCodeDynamicEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingQrCodeDynamic(event: QrCodeDynamicEvent): void;

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyQrCodeDynamic(event: QrCodeDynamicEvent): void;

  /**
   * Emit error event.
   * @param event Data.
   */
  errorQrCodeDynamic(event: QrCodeDynamicEvent): void;
}
