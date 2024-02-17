import { PixKey, PixKeyVerification } from '@zro/pix-keys/domain';

export interface PixKeyVerificationRepository {
  /**
   * Create a new pix key verification.
   *
   * @param pixKeyVerification The verification try.
   * @return Created pix key verification.
   */
  create(pixKeyVerification: PixKeyVerification): Promise<PixKeyVerification>;

  /**
   * Count number of pix key verifications related to pix key.
   *
   * @param pixKey Pix key.
   * @return Number of verifications found.
   */
  countByPixKey(pixKey: PixKey): Promise<number>;

  /**
   * Soft delete pix key verifications by pix key id.
   *
   * @param pixKey Pix key.
   * @return void.
   */
  deleteByPixKey(pixKey: PixKey): Promise<void>;
}
