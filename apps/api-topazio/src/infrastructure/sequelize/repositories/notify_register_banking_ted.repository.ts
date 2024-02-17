import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyRegisterBankingTedModel } from '@zro/api-topazio/infrastructure';
import {
  NotifyRegisterBankingTed,
  NotifyRegisterBankingTedRepository,
} from '@zro/api-topazio/domain';

export class NotifyRegisterBankingTedDatabaseRepository
  extends DatabaseRepository
  implements NotifyRegisterBankingTedRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    notifyRegister: NotifyRegisterBankingTedModel,
  ): NotifyRegisterBankingTed {
    return notifyRegister?.toDomain() ?? null;
  }

  async create(
    notifyRegister: NotifyRegisterBankingTed,
  ): Promise<NotifyRegisterBankingTed> {
    const createdNotifyRegisterBankingTed =
      await NotifyRegisterBankingTedModel.create<NotifyRegisterBankingTedModel>(
        notifyRegister,
        { transaction: this.transaction },
      );

    notifyRegister.id = createdNotifyRegisterBankingTed.id;
    notifyRegister.createdAt = createdNotifyRegisterBankingTed.createdAt;

    return notifyRegister;
  }
}
