import { Signup } from '@zro/signup/domain';

export interface SignupRepository {
  /**
   * Get signup by phone number.
   * @param phoneNumber The phone number.
   * @returns The signup if found or null otherwise.
   */
  getByPhoneNumber: (phoneNumber: string) => Promise<Signup>;

  /**
   * Get signup by id.
   * @param id The id of the signup.
   * @returns The signup if found or null otherwise.
   */
  getById: (id: string) => Promise<Signup>;

  /**
   * Update signup.
   *
   * @param signup Signup.
   * @returns Updated signup.
   */
  update: (signup: Signup) => Promise<Signup>;

  /**
   * Create signup.
   *
   * @param signup Signup.
   * @returns Created signup.
   */
  create: (signup: Signup) => Promise<Signup>;

  /**
   * Get pending confirmation expired signups.
   * @param expiration Minutes after creation define pending signup expiration.
   * @returns Expired signups.
   */
  getAllExpiredSignups: (expiration: number) => Promise<Signup[]>;
}
