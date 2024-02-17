import { QrCodeStatic } from '@zro/pix-payments/domain';

export interface QrCodeStaticCacheRepository {
  /**
   * Create qrCode.
   *
   * @param qrCode New qrCode.
   * @returns Created qrCode.
   */
  create(qrCode: QrCodeStatic, ttl: number): Promise<QrCodeStatic>;

  /**
   * Get by txid.
   * @param txId QrCode's txId.
   * @returns QrCodeStatic found or null otherwise.
   */
  getByTxId(txId: string): Promise<QrCodeStatic>;
}
