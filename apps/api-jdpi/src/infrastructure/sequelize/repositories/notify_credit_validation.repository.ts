import { DatabaseRepository } from '@zro/common';
import {
  NotifyCreditValidation,
  NotifyCreditValidationRepository,
} from '@zro/api-jdpi/domain';
import { NotifyCreditValidationModel } from '@zro/api-jdpi/infrastructure';

export class NotifyCreditValidationDatabaseRepository
  extends DatabaseRepository
  implements NotifyCreditValidationRepository
{
  static toDomain(
    notifyCreditValidation: NotifyCreditValidationModel,
  ): NotifyCreditValidation {
    return notifyCreditValidation?.toDomain() ?? null;
  }

  async create(
    notifyCreditValidation: NotifyCreditValidation,
  ): Promise<NotifyCreditValidation> {
    const createdNotifyCreditValidation =
      await NotifyCreditValidationModel.create<NotifyCreditValidationModel>(
        notifyCreditValidation,
        { transaction: this.transaction },
      );

    notifyCreditValidation.createdAt = createdNotifyCreditValidation.createdAt;

    return notifyCreditValidation;
  }

  async getById(id: string): Promise<NotifyCreditValidation> {
    return NotifyCreditValidationModel.findOne<NotifyCreditValidationModel>({
      where: { id },
      transaction: this.transaction,
    }).then(NotifyCreditValidationDatabaseRepository.toDomain);
  }
}
