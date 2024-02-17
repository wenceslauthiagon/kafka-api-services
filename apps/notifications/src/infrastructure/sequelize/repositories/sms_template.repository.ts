import { DatabaseRepository } from '@zro/common';
import { SmsTemplate, SmsTemplateRepository } from '@zro/notifications/domain';
import { SmsTemplateModel } from '@zro/notifications/infrastructure';

export class SmsTemplateDatabaseRepository
  extends DatabaseRepository
  implements SmsTemplateRepository
{
  /**
   * Convert SmsTemplate model to SmsTemplate domain.
   * @param smsTemplate Model instance.
   * @returns {Domain instance.
   */
  static toDomain(smsTemplate: SmsTemplateModel): SmsTemplate {
    return smsTemplate?.toDomain() ?? null;
  }

  /**
   * Get smsTemplate by tag.
   * @param tag SmsTemplate tag.
   * @returns SmsTemplate found or null otherwise.
   */
  async getByTag(tag: string): Promise<SmsTemplate> {
    return SmsTemplateModel.findOne({
      where: { tag },
      transaction: this.transaction,
    }).then(SmsTemplateDatabaseRepository.toDomain);
  }
}
