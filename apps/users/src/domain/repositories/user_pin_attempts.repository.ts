import { User } from '../entities/user.entity';
import { UserPinAttempts } from '../entities/user_pin_attempts.entity';

export interface UserPinAttemptsRepository {
  /**
   * Get user pin attempts by owner.
   * @param user User owner.
   * @returns User pin attempts found or null otherwise.
   */
  getByUser(user: User): Promise<UserPinAttempts>;

  /**
   * Create user pin attempts.
   * @param userAttempts User pin attempts object.
   * @returns User pin attempts created.
   */
  create(userAttempts: UserPinAttempts): Promise<UserPinAttempts>;

  /**
   * Update user pin attempts.
   * @param userAttempts User pin attempts object.
   * @returns User pin attempts updated.
   */
  update(userAttempts: UserPinAttempts): Promise<UserPinAttempts>;
}
