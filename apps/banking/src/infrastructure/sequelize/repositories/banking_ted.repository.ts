import { Transaction, Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import { Operation } from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  BankingTed,
  BankingTedRepository,
  TGetBankingTedFilter,
} from '@zro/banking/domain';
import { BankingTedModel } from '@zro/banking/infrastructure';

export class BankingTedDatabaseRepository
  extends DatabaseRepository
  implements BankingTedRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(bankingTedModel: BankingTedModel): BankingTed {
    return bankingTedModel?.toDomain() ?? null;
  }

  async create(bankingTed: BankingTed): Promise<BankingTed> {
    const createdBankingTed = await BankingTedModel.create<BankingTedModel>(
      bankingTed,
      {
        transaction: this.transaction,
      },
    );

    bankingTed.id = createdBankingTed.id;
    bankingTed.createdAt = createdBankingTed.createdAt;

    return bankingTed;
  }

  async update(bankingTed: BankingTed): Promise<BankingTed> {
    await BankingTedModel.update<BankingTedModel>(bankingTed, {
      where: { id: bankingTed.id },
      transaction: this.transaction,
    });

    return bankingTed;
  }

  async getAll(): Promise<BankingTed[]> {
    return BankingTedModel.findAll<BankingTedModel>({
      transaction: this.transaction,
    }).then((res) => res.map(BankingTedDatabaseRepository.toDomain));
  }

  async getById(id: number): Promise<BankingTed> {
    return BankingTedModel.findOne<BankingTedModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankingTedDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<BankingTed> {
    return BankingTedModel.findOne<BankingTedModel>({
      where: { operationId: operation.id },
      transaction: this.transaction,
    }).then(BankingTedDatabaseRepository.toDomain);
  }

  async getByUserAndOperation(
    user: User,
    operation: Operation,
  ): Promise<BankingTed> {
    return BankingTedModel.findOne<BankingTedModel>({
      where: { userId: user.uuid, operationId: operation.id },
      transaction: this.transaction,
    }).then(BankingTedDatabaseRepository.toDomain);
  }

  async getByFilterAndUserAndPagination(
    filter: TGetBankingTedFilter,
    user: User,
    pagination: Pagination,
  ): Promise<TPaginationResponse<BankingTed>> {
    const {
      operationId,
      state,
      beneficiaryDocument,
      createdAtStart,
      createdAtEnd,
      confirmedAtStart,
      confirmedAtEnd,
      failedAtStart,
      failedAtEnd,
    } = filter;
    const where = {
      userId: user.uuid,
      ...(operationId && { operationId }),
      ...(state && { state }),
      ...(beneficiaryDocument && { beneficiaryDocument }),
      ...(createdAtStart &&
        createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(confirmedAtStart &&
        confirmedAtEnd && {
          confirmedAt: {
            [Op.between]: [
              getMoment(confirmedAtStart).startOf('day').toISOString(),
              getMoment(confirmedAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(failedAtStart &&
        failedAtEnd && {
          failedAt: {
            [Op.between]: [
              getMoment(failedAtStart).startOf('day').toISOString(),
              getMoment(failedAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
    };

    return BankingTedModel.findAndCountAll<BankingTedModel>({
      where,
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(BankingTedDatabaseRepository.toDomain),
      ),
    );
  }

  async getByTransactionId(transactionId: string): Promise<BankingTed> {
    return BankingTedModel.findOne<BankingTedModel>({
      where: { transactionId },
      transaction: this.transaction,
    }).then(BankingTedDatabaseRepository.toDomain);
  }
}
