import { Transaction, Op } from 'sequelize';
import {
  DatabaseRepository,
  getMoment,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  TGetAdminBankingTedFilter,
} from '@zro/banking/domain';
import { AdminBankingTedModel } from '@zro/banking/infrastructure';

export class AdminBankingTedDatabaseRepository
  extends DatabaseRepository
  implements AdminBankingTedRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(bankingTedModel: AdminBankingTedModel): AdminBankingTed {
    return bankingTedModel?.toDomain() ?? null;
  }

  async create(bankingTed: AdminBankingTed): Promise<AdminBankingTed> {
    const createdAdminBankingTed =
      await AdminBankingTedModel.create<AdminBankingTedModel>(bankingTed, {
        transaction: this.transaction,
      });

    bankingTed.id = createdAdminBankingTed.id;
    bankingTed.createdAt = createdAdminBankingTed.createdAt;

    return bankingTed;
  }

  async update(bankingTed: AdminBankingTed): Promise<AdminBankingTed> {
    await AdminBankingTedModel.update<AdminBankingTedModel>(bankingTed, {
      where: { id: bankingTed.id },
      transaction: this.transaction,
    });

    return bankingTed;
  }

  async getById(id: string): Promise<AdminBankingTed> {
    return AdminBankingTedModel.findOne<AdminBankingTedModel>({
      where: { id },
      transaction: this.transaction,
    }).then(AdminBankingTedDatabaseRepository.toDomain);
  }

  async getByTransactionId(transactionId: string): Promise<AdminBankingTed> {
    return AdminBankingTedModel.findOne<AdminBankingTedModel>({
      where: { transactionId },
      transaction: this.transaction,
    }).then(AdminBankingTedDatabaseRepository.toDomain);
  }

  async getByFilterAndPagination(
    filter: TGetAdminBankingTedFilter,
    pagination: Pagination,
  ): Promise<TPaginationResponse<AdminBankingTed>> {
    const {
      sourceId,
      destinationId,
      state,
      transactionId,
      confirmedAtStart,
      confirmedAtEnd,
      failedAtStart,
      failedAtEnd,
      createdAtStart,
      createdAtEnd,
    } = filter;

    const where = {
      ...(sourceId && { sourceId }),
      ...(destinationId && { destinationId }),
      ...(state && { state }),
      ...(transactionId && { transactionId }),
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

    return AdminBankingTedModel.findAndCountAll<AdminBankingTedModel>({
      where,
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(AdminBankingTedDatabaseRepository.toDomain),
      ),
    );
  }
}
