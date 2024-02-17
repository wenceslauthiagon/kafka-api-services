import { DatabaseRepository } from '@zro/common';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import { BellNotificationModel } from '@zro/notifications/infrastructure';

export class BellNotificationDatabaseRepository
  extends DatabaseRepository
  implements BellNotificationRepository
{
  /**
   * Convert BellNotification model to BellNotification domain.
   *
   * @param bellNotification Model instance.
   * @returns The Domain instance.
   */
  static toDomain(bellNotification: BellNotificationModel): BellNotification {
    return bellNotification?.toDomain() ?? null;
  }

  /**
   * Create bellNotification.
   *
   * @param bellNotification New bellNotification.
   * @returns Created bellNotification.
   */
  async create(bellNotification: BellNotification): Promise<BellNotification> {
    const createdBellNotification = await BellNotificationModel.create(
      bellNotification,
      { transaction: this.transaction },
    );
    bellNotification.id = createdBellNotification.id;
    bellNotification.read = createdBellNotification.read;

    return bellNotification;
  }

  /**
   * Update bellNotification.
   *
   * @param bellNotification New bellNotification.
   * @returns Updated bellNotification.
   */
  async update(bellNotification: BellNotification): Promise<BellNotification> {
    await BellNotificationModel.update(bellNotification, {
      where: { uuid: bellNotification.uuid },
      transaction: this.transaction,
    });

    return bellNotification;
  }

  /**
   * Get bellNotification by ID.
   *
   * @param uuid BellNotification ID
   * @returns BellNotification found or null otherwise.
   */
  async getByUuid(uuid: string): Promise<BellNotification> {
    return BellNotificationModel.findOne({
      where: { uuid },
      transaction: this.transaction,
    }).then(BellNotificationDatabaseRepository.toDomain);
  }
}
