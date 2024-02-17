import { User } from '@zro/users/domain';
import { DecodedPixKey, DecodedPixKeyState } from '@zro/pix-keys/domain';

export interface DecodedPixKeyRepository {
  /**
   * Insert a decoded PIX key.
   * @param decodedPixKey DecodedPixKey to save.
   * @returns Created key.
   */
  create: (decodedPixKey: DecodedPixKey) => Promise<DecodedPixKey>;

  /**
   * Update a decoded PIX key.
   * @param decodedPixKey DecodedPixKey to update.
   * @returns Updated key.
   */
  update: (decodedPixKey: DecodedPixKey) => Promise<DecodedPixKey>;

  /**
   * @returns Decoded key found or null.
   */
  getById(id: string): Promise<DecodedPixKey>;

  /**
   * Get by User.
   * @param user DecodedPixKey User
   * @returns Decoded key found or null.
   */
  getByUser(user: User): Promise<DecodedPixKey>;

  /**
   * Get by end-to-end ID.
   * @param user DecodedPixKey owner.
   * @returns Decoded key found or null otherwise.
   */
  getByUserAndEndToEndId(
    user: User,
    endToEndId: string,
  ): Promise<DecodedPixKey>;

  /**
   * Get by user and created after a date and state is.
   * @param user DecodedPixKey owner.
   * @param createdAt Created date.
   * @param state Decoded key state.
   * @returns Decoded keys found or empty list.
   */
  getByUserAndCreatedAtAfterAndState(
    user: User,
    createdAt: Date,
    state: DecodedPixKeyState,
  ): Promise<DecodedPixKey[]>;

  /**
   * Gets all not confirmed decoded pix keys of the last 24 hours
   * @param user DecodedPixKey owner.
   * @returns Number of found decoded pix keys.
   */
  countLast24HoursAndNotConfirmed(user: User): Promise<number>;
}
