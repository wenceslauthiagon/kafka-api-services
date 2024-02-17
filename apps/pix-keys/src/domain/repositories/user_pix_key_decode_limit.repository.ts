import { UserPixKeyDecodeLimit } from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';

export interface UserPixKeyDecodeLimitRepository {
  /**
   * Get a pix key decode limits.
   * @returns Found pix key decode limit or null otherwise.
   */
  getByUser: (user: User) => Promise<UserPixKeyDecodeLimit>;

  /**
   * Create new UserPixKeyDecodeLimit.
   * @param userPixKeyDecodeLimit UserPixKeyDecodeLimit to be created.
   * @returns The created UserPixKeyDecodeLimit.
   */
  create: (
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ) => Promise<UserPixKeyDecodeLimit>;

  /**
   * Update a UserPixKeyDecodeLimit.
   * @param userPixKeyDecodeLimit UserPixKeyDecodeLimit to be updated.
   * @returns The updated UserPixKeyDecodeLimit.
   */
  update: (
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ) => Promise<UserPixKeyDecodeLimit>;

  /**
   * Create or update new UserPixKeyDecodeLimit.
   * @param userPixKeyDecodeLimit UserPixKeyDecodeLimit to be created or updated.
   * @returns The created or updated UserPixKeyDecodeLimit.
   */
  createOrUpdate: (
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ) => Promise<UserPixKeyDecodeLimit>;
}
