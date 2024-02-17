import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  WarningPixSkipList,
  WarningPixSkipListRepository,
} from '@zro/pix-payments/domain';
import { WarningPixSkipListModel } from '@zro/pix-payments/infrastructure';

export class WarningPixSkipListDatabaseRepository
  extends DatabaseRepository
  implements WarningPixSkipListRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    warningPixSkipListModel: WarningPixSkipListModel,
  ): WarningPixSkipList {
    return warningPixSkipListModel?.toDomain() ?? null;
  }

  async create(
    warningPixSkipList: WarningPixSkipList,
  ): Promise<WarningPixSkipList> {
    const warningPixSkipListGenerated =
      await WarningPixSkipListModel.create<WarningPixSkipListModel>(
        warningPixSkipList,
        {
          transaction: this.transaction,
        },
      );

    warningPixSkipList.createdAt = warningPixSkipListGenerated.createdAt;
    warningPixSkipList.updatedAt = warningPixSkipListGenerated.updatedAt;
    return warningPixSkipList;
  }

  async update(
    warningPixSkipList: WarningPixSkipList,
  ): Promise<WarningPixSkipList> {
    await WarningPixSkipListModel.update<WarningPixSkipListModel>(
      warningPixSkipList,
      {
        where: { id: warningPixSkipList.id },
        transaction: this.transaction,
      },
    );

    return warningPixSkipList;
  }

  async getByClientAccountNumber(
    clientAccountNumber: string,
  ): Promise<WarningPixSkipList> {
    return WarningPixSkipListModel.findOne<WarningPixSkipListModel>({
      where: {
        clientAccountNumber,
      },
      transaction: this.transaction,
    }).then(WarningPixSkipListDatabaseRepository.toDomain);
  }
}
