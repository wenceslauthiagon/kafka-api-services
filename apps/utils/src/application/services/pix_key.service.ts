import { DecodedPixKey } from '@zro/pix-keys/domain';

export interface PixKeyService {
  /**
   * Create decoded pix key.
   * @param decodedPixKey Decoded pix key.
   * @returns Decoded pix key created.
   */
  createDecoded(decodedPixKey: DecodedPixKey): Promise<DecodedPixKey>;
}
