import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  WarningPixBlockList,
  WarningPixBlockListRepository,
} from '@zro/pix-payments/domain';
import { WarningPixBlockListModel } from '@zro/pix-payments/infrastructure';

export class WarningPixBlockListDatabaseRepository
  extends DatabaseRepository
  implements WarningPixBlockListRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    warningPixBlockListModel: WarningPixBlockListModel,
  ): WarningPixBlockList {
    return warningPixBlockListModel?.toDomain() ?? null;
  }

  async create(
    warningPixBlockList: WarningPixBlockList,
  ): Promise<WarningPixBlockList> {
    const warningPixBlockListGenerated =
      await WarningPixBlockListModel.create<WarningPixBlockListModel>(
        warningPixBlockList,
        {
          transaction: this.transaction,
        },
      );

    warningPixBlockList.createdAt = warningPixBlockListGenerated.createdAt;
    warningPixBlockList.updatedAt = warningPixBlockListGenerated.updatedAt;
    return warningPixBlockList;
  }

  async update(
    warningPixBlockList: WarningPixBlockList,
  ): Promise<WarningPixBlockList> {
    await WarningPixBlockListModel.update<WarningPixBlockListModel>(
      warningPixBlockList,
      {
        where: { id: warningPixBlockList.id },
        transaction: this.transaction,
      },
    );

    return warningPixBlockList;
  }

  async getAllCpf(): Promise<Array<string>> {
    const blockedCpfs =
      await WarningPixBlockListModel.findAll<WarningPixBlockListModel>({
        attributes: ['cpf'],
        transaction: this.transaction,
      });

    return blockedCpfs.map((model) => model.cpf);
  }
}
