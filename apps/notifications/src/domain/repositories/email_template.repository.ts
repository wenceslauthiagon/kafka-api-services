import { EmailTemplate } from '../entities/email_template.entity';

export interface EmailTemplateRepository {
  /**
   * Search template by tag.
   * @param tag Template tag
   * @returns Template found or null otherwise.
   */
  getByTag: (tag: string) => Promise<EmailTemplate>;
}
