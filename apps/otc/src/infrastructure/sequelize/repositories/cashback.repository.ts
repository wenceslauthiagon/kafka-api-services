import { DatabaseRepository } from '@zro/common';
import { Cashback, CashbackRepository } from '@zro/otc/domain';
import { CashbackModel, ConversionModel } from '@zro/otc/infrastructure';

export class CashbackDatabaseRepository
  extends DatabaseRepository
  implements CashbackRepository
{
  static toDomain(model: CashbackModel): Cashback {
    return model?.toDomain() ?? null;
  }

  async create(cashback: Cashback): Promise<Cashback> {
    const createdCashback = await CashbackModel.create<CashbackModel>(
      cashback,
      { transaction: this.transaction },
    );

    cashback.id = createdCashback.id;
    cashback.createdAt = createdCashback.createdAt;

    return cashback;
  }

  async update(cashback: Cashback): Promise<Cashback> {
    await CashbackModel.update<CashbackModel>(cashback, {
      where: { id: cashback.id },
      transaction: this.transaction,
    });

    return cashback;
  }

  async getById(id: string): Promise<Cashback> {
    return CashbackModel.findOne<CashbackModel>({
      where: { id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(CashbackDatabaseRepository.toDomain);
  }

  async getWithConversionById(id: string): Promise<Cashback> {
    return CashbackModel.findOne<CashbackModel>({
      where: { id },
      include: { model: ConversionModel },
      transaction: this.transaction,
    }).then(CashbackDatabaseRepository.toDomain);
  }
}
