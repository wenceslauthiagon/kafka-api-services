import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';

export enum UserRequestSort {
  CREATED_AT = 'created_at',
}

export interface UserRepository {
  /**
   * Create user.
   *
   * @param user User.
   * @returns Created user.
   */
  create(user: User): Promise<User>;

  /**
   * Update user.
   *
   * @param user User.
   * @returns Updated user.
   */
  update(user: User): Promise<User>;

  /**
   * Get user by phone number.
   * @param phoneNumber The phone number.
   * @returns The user if found or null otherwise.
   */
  getByPhoneNumber(phoneNumber: string): Promise<User>;

  /**
   * Get user by id.
   * @param id The id of the user.
   * @returns The user if found or null otherwise.
   */
  getById(id: number): Promise<User>;

  /**
   * Get user by uuid.
   * @param uuid The uuid of the user.
   * @returns The user if found or null otherwise.
   */
  getByUuid(uuid: string): Promise<User>;

  /**
   * Get user by document.
   * @param document The document of the user.
   * @returns The user if found or null otherwise.
   */
  getByDocument(document: string): Promise<User>;

  /**
   * Get user by email.
   * @param email The email of the user.
   * @returns The user if found or null otherwise.
   */
  getByEmail(email: string): Promise<User>;

  /**
   * Get user by referral code.
   * @param referralCode Affiliate program user code.
   * @returns The user if found or null otherwise.
   */
  getByReferralCode(referralCode: string): Promise<User>;

  /**
   * Get pending confirmation expired users.
   * @param expiration Minutes after creation define pending user expiration.
   * @returns Expired users.
   */
  getAllExpiredUsers(expiration: number): Promise<User[]>;

  /**
   * Get active and bank onboarding state complete users.
   * @returns Users.
   */
  getAllActiveAndBankOnboardingStateIsCompleteUsers(
    pagination: Pagination,
  ): Promise<TPaginationResponse<User>>;

  /**
   * Soft delete user.
   * @param user User.
   */
  delete(user: User): Promise<void>;
}
