import { UserForgotPassword } from '@zro/users/domain';

export type UserForgotPasswordEvent = Pick<
  UserForgotPassword,
  'id' | 'state' | 'phoneNumber' | 'user'
>;

export interface UserForgotPasswordEventEmitter {
  /**
   * Emit created user forgot password event.
   * @param userForgotPassword Data.
   */
  created: (userForgotPassword: UserForgotPassword) => void;

  /**
   * Emit declined user forgot password event.
   * @param userForgotPassword Data.
   */
  declined: (userForgotPassword: UserForgotPassword) => void;

  /**
   * Emit confirmed user forgot password event.
   * @param userForgotPassword Data.
   */
  confirmed: (userForgotPassword: UserForgotPassword) => void;

  /**
   * Emit expired user forgot password event.
   * @param userForgotPassword Data.
   */
  expired: (userForgotPassword: UserForgotPassword) => void;
}
