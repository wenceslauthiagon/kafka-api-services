import { QrCode } from '@zro/pix-zro-pay/domain';

export interface QrCodeRepository {
  /**
   * Create qrCode.
   *
   * @param qrCode New qrCode.
   * @returns Created qrCode.
   */
  create: (qrCode: QrCode, ttl: number) => Promise<QrCode>;

  /**
   * Update qrCode.
   *
   * @param qrCode New qrCode.
   * @returns Created qrCode.
   */
  update: (qrCode: QrCode, ttl: number) => Promise<QrCode>;

  /**
   * Get all.
   * @returns QrCode found or null otherwise.
   */
  getAll: () => Promise<QrCode[]>;

  /**
   * Get by txid.
   * @returns QrCode found or null otherwise.
   */
  getByTxId: (txId: string) => Promise<QrCode>;
}
