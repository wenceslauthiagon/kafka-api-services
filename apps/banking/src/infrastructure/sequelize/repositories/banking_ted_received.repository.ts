import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import {
  BankingTedReceived,
  BankingTedReceivedRepository,
} from '@zro/banking/domain';
import { BankingTedReceivedModel } from '@zro/banking/infrastructure';

export class BankingTedReceivedDatabaseRepository
  extends DatabaseRepository
  implements BankingTedReceivedRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    bankingTedReceivedModel: BankingTedReceivedModel,
  ): BankingTedReceived {
    return bankingTedReceivedModel?.toDomain() ?? null;
  }

  async create(
    bankingTedReceived: BankingTedReceived,
  ): Promise<BankingTedReceived> {
    const createdBankingTedReceived =
      await BankingTedReceivedModel.create<BankingTedReceivedModel>(
        bankingTedReceived,
        {
          transaction: this.transaction,
        },
      );

    bankingTedReceived.id = createdBankingTedReceived.id;
    bankingTedReceived.createdAt = createdBankingTedReceived.createdAt;

    return bankingTedReceived;
  }

  async update(
    bankingTedReceived: BankingTedReceived,
  ): Promise<BankingTedReceived> {
    await BankingTedReceivedModel.update<BankingTedReceivedModel>(
      bankingTedReceived,
      {
        where: { id: bankingTedReceived.id },
        transaction: this.transaction,
      },
    );

    return bankingTedReceived;
  }

  async getAll(): Promise<BankingTedReceived[]> {
    return BankingTedReceivedModel.findAll<BankingTedReceivedModel>({
      transaction: this.transaction,
    }).then((res) => res.map(BankingTedReceivedDatabaseRepository.toDomain));
  }

  async getById(id: number): Promise<BankingTedReceived> {
    return BankingTedReceivedModel.findOne<BankingTedReceivedModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankingTedReceivedDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<BankingTedReceived> {
    return BankingTedReceivedModel.findOne<BankingTedReceivedModel>({
      where: { operationId: operation.id },
      transaction: this.transaction,
    }).then(BankingTedReceivedDatabaseRepository.toDomain);
  }
}
