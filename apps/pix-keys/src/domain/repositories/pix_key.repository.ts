import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey, KeyState } from '@zro/pix-keys/domain';

export interface PixKeyRepository {
  /**
   * Insert a PIX key.
   * @param {PixKey} pixKey PixKey to save.
   * @returns {PixKey} Created key.
   */
  create: (pixKey: PixKey) => Promise<PixKey>;

  /**
   * Update a PIX key.
   * @param {PixKey} pixKey PixKey to update.
   * @returns {PixKey} Updated key.
   */
  update: (pixKey: PixKey) => Promise<PixKey>;

  /**
   * Search by key ID.
   * @param {UUID} id Key ID.
   * @return {PixKey} Key found.
   */
  getByIdAndStateIsNotCanceled: (id: string) => Promise<PixKey>;

  /**
   * Search not canceled by key.
   * @param {String} key Key.
   * @return {PixKey[]} Keys found.
   */
  getByKeyAndStateIsNotCanceled: (key: string) => Promise<PixKey[]>;

  /**
   * Search not canceled by user and key.
   * @param {User} user User owner.
   * @param {String} key Pix key.
   * @return {PixKey} Key found.
   */
  getByUserAndKeyAndStateIsNotCanceled: (
    user: User,
    key: string,
  ) => Promise<PixKey>;

  /**
   * Count by user.
   * @param {User} user Keys' owner.
   * @return {Integer} Number of keys found.
   */
  countByUserAndStateIsNotCanceled: (user: User) => Promise<number>;

  /**
   * List all pix key by pagination and user.
   * @param {Pagination} pagination The pagination.
   * @param {[User]} user Keys' owner.
   * @return {PixKey[]} Keys found.
   */
  getByUserAndStateIsNotCanceled: (
    pagination: Pagination,
    user?: User,
  ) => Promise<TPaginationResponse<PixKey>>;

  /**
   * Search by key id.
   * @param {User} user User owner.
   * @param {UUID} id The key id
   * @return {PixKey} Key found.
   */
  getByUserAndIdAndStateIsNotCanceled: (
    user: User,
    id: string,
  ) => Promise<PixKey>;

  /**
   * Search by key updatedAt and states.
   * @param {Date} updatedAt Key updatedAt.
   * @param {KeyState[]} states Key states.
   * @return {PixKey[]} Keys found.
   */
  getByLessUpdatedAtAndStateIn: (
    updatedAt: Date,
    states: KeyState[],
  ) => Promise<PixKey[]>;

  /**
   * Search by pix key id.
   * @param {UUID} id The key id
   * @return {PixKey} Keys found.
   */
  getById: (id: string) => Promise<PixKey>;

  /**
   * Search by pix key id and states.
   * @param {string} key The key
   * @param {KeyState[]} states Key states.
   * @return {PixKey} Keys found.
   */
  getByKeyAndStateIn: (key: string, states: KeyState[]) => Promise<PixKey[]>;

  /**
   * Search by pix key state.
   * @param {KeyState} state Key state.
   * @return {PixKey} Keys found.
   */
  getByState: (state: KeyState) => Promise<PixKey[]>;
}
