import { DatabaseRepository } from '@zro/common';
import {
  BankingCashInBillet,
  BankingCashInBilletRepository,
} from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';
import { BankingCashInBilletModel } from '@zro/banking/infrastructure';

export class BankingCashInBilletDatabaseRepository
  extends DatabaseRepository
  implements BankingCashInBilletRepository
{
  static toDomain(
    bankingCashInBillet: BankingCashInBilletModel,
  ): BankingCashInBillet {
    return bankingCashInBillet?.toDomain() ?? null;
  }

  async create(
    bankingCashInBillet: BankingCashInBillet,
  ): Promise<BankingCashInBillet> {
    const createdBankingCashInBillet =
      await BankingCashInBilletModel.create<BankingCashInBilletModel>(
        bankingCashInBillet,
        {
          transaction: this.transaction,
        },
      );

    bankingCashInBillet.id = createdBankingCashInBillet.id;
    bankingCashInBillet.createdAt = createdBankingCashInBillet.createdAt;

    return bankingCashInBillet;
  }

  async update(
    bankingCashInBillet: BankingCashInBillet,
  ): Promise<BankingCashInBillet> {
    await BankingCashInBilletModel.update<BankingCashInBilletModel>(
      bankingCashInBillet,
      {
        where: { id: bankingCashInBillet.id },
        transaction: this.transaction,
      },
    );

    return bankingCashInBillet;
  }

  async getById(id: string): Promise<BankingCashInBillet> {
    return BankingCashInBilletModel.findOne<BankingCashInBilletModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankingCashInBilletDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<BankingCashInBillet> {
    return BankingCashInBilletModel.findOne<BankingCashInBilletModel>({
      where: { operationId: operation.id },
      transaction: this.transaction,
    }).then(BankingCashInBilletDatabaseRepository.toDomain);
  }
}
