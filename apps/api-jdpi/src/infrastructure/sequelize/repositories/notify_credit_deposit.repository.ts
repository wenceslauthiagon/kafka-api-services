import { DatabaseRepository } from '@zro/common';
import {
  NotifyCreditDeposit,
  NotifyCreditDepositRepository,
} from '@zro/api-jdpi/domain';
import { NotifyCreditDepositModel } from '@zro/api-jdpi/infrastructure';

export class NotifyCreditDepositDatabaseRepository
  extends DatabaseRepository
  implements NotifyCreditDepositRepository
{
  static toDomain(
    notifyCreditDeposit: NotifyCreditDepositModel,
  ): NotifyCreditDeposit {
    return notifyCreditDeposit?.toDomain() ?? null;
  }

  async create(
    notifyCreditDeposit: NotifyCreditDeposit,
  ): Promise<NotifyCreditDeposit> {
    const createdNotifyCredit =
      await NotifyCreditDepositModel.create<NotifyCreditDepositModel>(
        notifyCreditDeposit,
        { transaction: this.transaction },
      );

    notifyCreditDeposit.id = createdNotifyCredit.id;
    notifyCreditDeposit.createdAt = createdNotifyCredit.createdAt;

    return notifyCreditDeposit;
  }
}
