import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyInfractionModel } from '@zro/api-topazio/infrastructure';
import {
  NotifyInfraction,
  NotifyInfractionRepository,
} from '@zro/api-topazio/domain';
import { PixInfractionStatus } from '@zro/pix-payments/domain';

export class NotifyInfractionDatabaseRepository
  extends DatabaseRepository
  implements NotifyInfractionRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(notifyInfraction: NotifyInfractionModel): NotifyInfraction {
    return notifyInfraction?.toDomain() ?? null;
  }

  async create(notifyInfraction: NotifyInfraction): Promise<NotifyInfraction> {
    const createdNotifyInfraction =
      await NotifyInfractionModel.create<NotifyInfractionModel>(
        notifyInfraction,
        {
          transaction: this.transaction,
        },
      );

    notifyInfraction.createdAt = createdNotifyInfraction.createdAt;

    return notifyInfraction;
  }

  async getByInfractionIdAndStatus(
    id: string,
    status: PixInfractionStatus,
  ): Promise<NotifyInfraction> {
    return NotifyInfractionModel.findOne<NotifyInfractionModel>({
      where: {
        infractionId: id,
        status,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(NotifyInfractionDatabaseRepository.toDomain);
  }
}
