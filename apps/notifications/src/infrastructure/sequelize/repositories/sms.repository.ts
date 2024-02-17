import { DatabaseRepository } from '@zro/common';
import { Sms, SmsRepository } from '@zro/notifications/domain';
import { SmsModel } from '@zro/notifications/infrastructure';

export class SmsDatabaseRepository
  extends DatabaseRepository
  implements SmsRepository
{
  /**
   * Convert Sms model to Sms domain.
   * @param sms Model instance.
   * @returns {Domain instance.
   */
  static toDomain(sms: SmsModel): Sms {
    return sms?.toDomain() ?? null;
  }

  /**
   * Create sms.
   *
   * @param sms New sms.
   * @returns Created sms.
   */
  async create(sms: Sms): Promise<Sms> {
    const createdSms = await SmsModel.create(sms, {
      transaction: this.transaction,
    });

    sms.id = createdSms.id;

    return sms;
  }

  /**
   * Update sms.
   *
   * @param sms New sms.
   * @returns Created sms.
   */
  async update(sms: Sms): Promise<Sms> {
    await SmsModel.update(sms, {
      where: { id: sms.id },
      transaction: this.transaction,
    });

    return sms;
  }

  /**
   * Get sms by ID.
   * @param id Sms UUID.
   * @returns Sms found or null otherwise.
   */
  async getById(id: string): Promise<Sms> {
    return SmsModel.findOne({
      where: { id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(SmsDatabaseRepository.toDomain);
  }
}
