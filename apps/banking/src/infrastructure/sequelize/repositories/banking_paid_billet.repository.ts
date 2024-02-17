import { DatabaseRepository } from '@zro/common';
import {
  BankingPaidBillet,
  BankingPaidBilletRepository,
} from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';
import { BankingPaidBilletModel } from '@zro/banking/infrastructure';

export class BankingPaidBilletDatabaseRepository
  extends DatabaseRepository
  implements BankingPaidBilletRepository
{
  static toDomain(
    bankingBilletDeposit: BankingPaidBilletModel,
  ): BankingPaidBillet {
    return bankingBilletDeposit?.toDomain() ?? null;
  }

  async create(
    bankingBilletDeposit: BankingPaidBillet,
  ): Promise<BankingPaidBillet> {
    const createdBankingPaidBillet =
      await BankingPaidBilletModel.create<BankingPaidBilletModel>(
        bankingBilletDeposit,
        {
          transaction: this.transaction,
        },
      );

    bankingBilletDeposit.id = createdBankingPaidBillet.id;
    bankingBilletDeposit.createdAt = createdBankingPaidBillet.createdAt;

    return bankingBilletDeposit;
  }

  async update(
    bankingBilletDeposit: BankingPaidBillet,
  ): Promise<BankingPaidBillet> {
    await BankingPaidBilletModel.update<BankingPaidBilletModel>(
      bankingBilletDeposit,
      {
        where: { id: bankingBilletDeposit.id },
        transaction: this.transaction,
      },
    );

    return bankingBilletDeposit;
  }

  async getById(id: string): Promise<BankingPaidBillet> {
    return BankingPaidBilletModel.findOne<BankingPaidBilletModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankingPaidBilletDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<BankingPaidBillet> {
    return BankingPaidBilletModel.findOne<BankingPaidBilletModel>({
      where: { operationId: operation.id },
      transaction: this.transaction,
    }).then(BankingPaidBilletDatabaseRepository.toDomain);
  }
}
