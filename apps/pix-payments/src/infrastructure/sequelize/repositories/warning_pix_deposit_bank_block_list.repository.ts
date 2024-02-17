import { DatabaseRepository } from '@zro/common';
import {
  WarningPixDepositBankBlockList,
  WarningPixDepositBankBlockListRepository,
} from '@zro/pix-payments/domain';
import { WarningPixDepositBankBlockListModel } from '@zro/pix-payments/infrastructure';

export class WarningPixDepositBankBlockListDatabaseRepository
  extends DatabaseRepository
  implements WarningPixDepositBankBlockListRepository
{
  static toDomain(
    warningPixBlockListModel: WarningPixDepositBankBlockListModel,
  ): WarningPixDepositBankBlockList {
    return warningPixBlockListModel?.toDomain() ?? null;
  }

  async getByCnpj(cnpj: string): Promise<WarningPixDepositBankBlockList> {
    return WarningPixDepositBankBlockListModel.findOne<WarningPixDepositBankBlockListModel>(
      {
        where: {
          cnpj,
        },
        transaction: this.transaction,
      },
    ).then(WarningPixDepositBankBlockListDatabaseRepository.toDomain);
  }
}
