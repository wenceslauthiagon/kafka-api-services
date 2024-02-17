import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyConfirmBankingTedModel } from '@zro/api-topazio/infrastructure';
import {
  NotifyConfirmBankingTed,
  NotifyConfirmBankingTedRepository,
} from '@zro/api-topazio/domain';

export class NotifyConfirmBankingTedDatabaseRepository
  extends DatabaseRepository
  implements NotifyConfirmBankingTedRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    notifyConfirm: NotifyConfirmBankingTedModel,
  ): NotifyConfirmBankingTed {
    return notifyConfirm?.toDomain() ?? null;
  }

  async create(
    notifyConfirm: NotifyConfirmBankingTed,
  ): Promise<NotifyConfirmBankingTed> {
    const createdNotifyConfirmBankingTed =
      await NotifyConfirmBankingTedModel.create<NotifyConfirmBankingTedModel>(
        notifyConfirm,
        { transaction: this.transaction },
      );

    notifyConfirm.id = createdNotifyConfirmBankingTed.id;
    notifyConfirm.createdAt = createdNotifyConfirmBankingTed.createdAt;

    return notifyConfirm;
  }
}
