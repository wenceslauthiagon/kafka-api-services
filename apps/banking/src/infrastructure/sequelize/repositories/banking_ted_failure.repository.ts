import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import {
  BankingTedFailure,
  BankingTedFailureRepository,
} from '@zro/banking/domain';
import { BankingTedFailureModel } from '@zro/banking/infrastructure';

export class BankingTedFailureDatabaseRepository
  extends DatabaseRepository
  implements BankingTedFailureRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    bankingTedFailureModel: BankingTedFailureModel,
  ): BankingTedFailure {
    return bankingTedFailureModel?.toDomain() ?? null;
  }

  async create(
    bankingTedFailure: BankingTedFailure,
  ): Promise<BankingTedFailure> {
    const createdBankingTedFailure =
      await BankingTedFailureModel.create<BankingTedFailureModel>(
        bankingTedFailure,
        {
          transaction: this.transaction,
        },
      );

    bankingTedFailure.id = createdBankingTedFailure.id;
    bankingTedFailure.createdAt = createdBankingTedFailure.createdAt;

    return bankingTedFailure;
  }

  async update(
    bankingTedFailure: BankingTedFailure,
  ): Promise<BankingTedFailure> {
    await BankingTedFailureModel.update<BankingTedFailureModel>(
      bankingTedFailure,
      {
        where: { id: bankingTedFailure.id },
        transaction: this.transaction,
      },
    );

    return bankingTedFailure;
  }

  async getAll(): Promise<BankingTedFailure[]> {
    return BankingTedFailureModel.findAll<BankingTedFailureModel>({
      transaction: this.transaction,
    }).then((res) => res.map(BankingTedFailureDatabaseRepository.toDomain));
  }

  async getById(id: number): Promise<BankingTedFailure> {
    return BankingTedFailureModel.findOne<BankingTedFailureModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankingTedFailureDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<BankingTedFailure> {
    return BankingTedFailureModel.findOne<BankingTedFailureModel>({
      where: { operationId: operation.id },
      transaction: this.transaction,
    }).then(BankingTedFailureDatabaseRepository.toDomain);
  }
}
