import { QrCode } from '@zro/pix-zro-pay/domain';

export type QrCodeEvent = Pick<
  QrCode,
  | 'transactionUuid'
  | 'txId'
  | 'description'
  | 'payerDocument'
  | 'emv'
  | 'expirationDate'
  | 'value'
  | 'company'
  | 'bankAccount'
  | 'client'
  | 'merchantId'
  | 'createdAt'
>;
export interface QrCodeEventEmitter {
  /**
   * Emit ready event.
   * @param event Data.
   */
  readyQrCode(event: QrCodeEvent): void;
}
