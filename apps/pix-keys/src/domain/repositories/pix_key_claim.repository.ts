import { PixKeyClaim } from '@zro/pix-keys/domain';

export interface PixKeyClaimRepository {
  /**
   * Insert a Claims for pix key.
   * @param {PixKeyClaim} pixKeyClaim PixKeyClaim to save.
   * @returns {PixKeyClaim} Created claims.
   */
  create: (pixKeyClaim: PixKeyClaim) => Promise<PixKeyClaim>;

  /**
   * Update a PIX key claim.
   * @param {PixKeyClaim} pixKey PixKeyClaim to update.
   * @returns {PixKeyClaim} Updated key.
   */
  update: (pixKeyClaim: PixKeyClaim) => Promise<PixKeyClaim>;

  /**
   * Search by pix key claim id.
   * @param {UUID} id The key id
   * @return {PixKeyClaim} Keys Claim found.
   */
  getById: (id: string) => Promise<PixKeyClaim>;

  /**
   * Search by pix key claim id and opening date.
   * @param {UUID} id The key id.
   * @param {Date} openingDate Claim opening date.
   * @return {PixKeyClaim} Keys Claim found.
   */
  getByIdAndLessOpeningDate: (
    id: string,
    openingDate: Date,
  ) => Promise<PixKeyClaim>;
}
