import { DecodedQrCode } from '@zro/pix-payments/domain';

export type DecodedQrCodeEvent = Pick<
  DecodedQrCode,
  'id' | 'user' | 'state' | 'emv'
>;

export interface DecodedQrCodeEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorDecodedQrCode(event: DecodedQrCodeEvent): void;

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyDecodedQrCode(event: DecodedQrCodeEvent): void;
}
