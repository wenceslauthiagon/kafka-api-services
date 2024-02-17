import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyClaimModel } from '@zro/api-topazio/infrastructure';
import { NotifyClaim, NotifyClaimRepository } from '@zro/api-topazio/domain';

export class NotifyClaimDatabaseRepository
  extends DatabaseRepository
  implements NotifyClaimRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(notifyClaim: NotifyClaimModel): NotifyClaim {
    return notifyClaim?.toDomain() ?? null;
  }

  async create(notifyClaim: NotifyClaim): Promise<NotifyClaim> {
    const createdNotifyClaim = await NotifyClaimModel.create<NotifyClaimModel>(
      notifyClaim,
      {
        transaction: this.transaction,
      },
    );

    notifyClaim.createdAt = createdNotifyClaim.createdAt;

    return notifyClaim;
  }
}
