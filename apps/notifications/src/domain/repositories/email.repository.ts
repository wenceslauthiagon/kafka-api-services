import { Email } from '../entities/email.entity';

export interface EmailRepository {
  /**
   * Create a new e-mail.
   * @param email The e-mail.
   * @returns The created e-mail.
   */
  create(email: Email): Promise<Email>;

  /**
   * Update an e-mail.
   * @param email The e-mail.
   * @returns The updated e-mail
   */
  update(email: Email): Promise<Email>;

  /**
   * Get e-mail by ID.
   * @param id E-mail ID.
   */
  getById(id: string): Promise<Email>;
}
