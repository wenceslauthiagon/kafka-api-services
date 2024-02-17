import { DatabaseRepository } from '@zro/common';
import {
  EmailTemplate,
  EmailTemplateRepository,
} from '@zro/notifications/domain';
import { EmailTemplateModel } from '@zro/notifications/infrastructure';

export class EmailTemplateDatabaseRepository
  extends DatabaseRepository
  implements EmailTemplateRepository
{
  /**
   * Convert EmailTemplate model to EmailTemplate domain.
   * @param emailTemplate Model instance.
   * @returns {Domain instance.
   */
  static toDomain(emailTemplate: EmailTemplateModel): EmailTemplate {
    return emailTemplate?.toDomain() ?? null;
  }

  /**
   * Get emailTemplate by tag.
   * @param tag EmailTemplate tag.
   * @returns EmailTemplate found or null otherwise.
   */
  async getByTag(tag: string): Promise<EmailTemplate> {
    return EmailTemplateModel.findOne({
      where: { tag },
      transaction: this.transaction,
    }).then(EmailTemplateDatabaseRepository.toDomain);
  }
}
