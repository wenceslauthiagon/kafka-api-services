import { SmsTemplate } from '../entities/sms_template.entity';

export interface SmsTemplateRepository {
  /**
   * Search template by tag.
   * @param tag Template tag
   * @returns Template found or null otherwise.
   */
  getByTag: (tag: string) => Promise<SmsTemplate>;
}
