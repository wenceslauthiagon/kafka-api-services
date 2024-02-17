import { DatabaseRepository } from '@zro/common';
import { Email, EmailRepository } from '@zro/notifications/domain';
import { EmailModel } from '@zro/notifications/infrastructure';

export class EmailDatabaseRepository
  extends DatabaseRepository
  implements EmailRepository
{
  /**
   * Convert Email model to Email domain.
   * @param email Model instance.
   * @returns {Domain instance.
   */
  static toDomain(email: EmailModel): Email {
    return email?.toDomain() ?? null;
  }

  /**
   * Create email.
   *
   * @param email New email.
   * @returns Created email.
   */
  async create(email: Email): Promise<Email> {
    const createdEmail = await EmailModel.create(email, {
      transaction: this.transaction,
    });

    email.id = createdEmail.id;

    return email;
  }

  /**
   * Update e-mail.
   *
   * @param email New email.
   * @returns Created email.
   */
  async update(email: Email): Promise<Email> {
    await EmailModel.update(email, {
      where: { id: email.id },
      transaction: this.transaction,
    });

    return email;
  }

  /**
   * Get email by ID.
   * @param id Email UUID.
   * @returns Email found or null otherwise.
   */
  async getById(id: string): Promise<Email> {
    return EmailModel.findOne({
      where: { id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(EmailDatabaseRepository.toDomain);
  }
}
