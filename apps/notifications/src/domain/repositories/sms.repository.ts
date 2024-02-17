import { Sms } from '../entities/sms.entity';

export interface SmsRepository {
  /**
   * Create a new e-mail.
   * @param sms The e-mail.
   * @returns The created e-mail.
   */
  create(sms: Sms): Promise<Sms>;

  /**
   * Update an e-mail.
   * @param sms The e-mail.
   * @returns The updated e-mail
   */
  update(sms: Sms): Promise<Sms>;

  /**
   * Get e-mail by ID.
   * @param id E-mail ID.
   */
  getById(id: string): Promise<Sms>;
}
