import {
  User,
  UserForgotPassword,
  UserForgotPasswordId,
  UserForgotPasswordState,
} from '@zro/users/domain';

export interface UserForgotPasswordRepository {
  /**
   * Get user forgot password by user and state.
   * @param user User owner.
   * @returns User forgot password found or null otherwise.
   */
  getByUserAndState(
    user: User,
    state: UserForgotPasswordState,
  ): Promise<UserForgotPassword>;

  /**
   * Get user forgot pasword by id.
   * @param id User forgot password id.
   * @returns User forgot password found or null otherwise.
   */
  getById(id: UserForgotPasswordId): Promise<UserForgotPassword>;

  /**
   * Get user forgot pasword by id and user.
   * @param id User forgot password id.
   * @param user User owner.
   * @returns User forgot password found or null otherwise.
   */
  getByIdAndUser(
    id: UserForgotPasswordId,
    user: User,
  ): Promise<UserForgotPassword>;

  /**
   * Create user forgot password.
   * @param userForgotPassword User forgot password object.
   * @returns User forgot password created.
   */
  create(userForgotPassword: UserForgotPassword): Promise<UserForgotPassword>;

  /**
   * Update user forgot password.
   * @param userForgotPassword User forgot password object.
   * @returns User forgot password updated.
   */
  update(userForgotPassword: UserForgotPassword): Promise<UserForgotPassword>;

  /**
   * Search by expiredAt and states.
   * @param expiredAt Key expiredAt.
   * @param states User forgot password states.
   * @return User forgot password found.
   */
  getByCreatedAtLessThanAndStateIn: (
    expiredAt: Date,
    states: UserForgotPasswordState[],
  ) => Promise<UserForgotPassword[]>;
}
