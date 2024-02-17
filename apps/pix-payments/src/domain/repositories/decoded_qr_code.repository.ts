import { DecodedQrCode } from '@zro/pix-payments/domain';

export interface DecodedQrCodeRepository {
  /**
   * Insert a DecodedQrCode.
   * @param decodedQrCode DecodedQrCode to save.
   * @returns Created DecodedQrCode.
   */
  create: (decodedQrCode: DecodedQrCode) => Promise<DecodedQrCode>;

  /**
   * Update a DecodedQrCode.
   * @param DecodedQrCode DecodedQrCode to update.
   * @returns Updated DecodedQrCode.
   */
  update: (decodedQrCode: DecodedQrCode) => Promise<DecodedQrCode>;

  /**
   * Search by DecodedQrCode ID.
   * @param id DecodedQrCode ID.
   * @return Found decoded qr code.
   */
  getById: (id: string) => Promise<DecodedQrCode>;
}
