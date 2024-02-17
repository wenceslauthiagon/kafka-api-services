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
  AdminBankingAccount,
  AdminBankingAccountRepository,
  TGetAdminBankingAccountFilter,
} from '@zro/banking/domain';
import { AdminBankingAccountModel } from '@zro/banking/infrastructure';

export class AdminBankingAccountDatabaseRepository
  extends DatabaseRepository
  implements AdminBankingAccountRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    bankingTedModel: AdminBankingAccountModel,
  ): AdminBankingAccount {
    return bankingTedModel?.toDomain() ?? null;
  }

  async getById(id: string): Promise<AdminBankingAccount> {
    return AdminBankingAccountModel.findOne<AdminBankingAccountModel>({
      where: { id, enabled: true },
      transaction: this.transaction,
    }).then(AdminBankingAccountDatabaseRepository.toDomain);
  }

  async getByFilterAndPagination(
    filter: TGetAdminBankingAccountFilter,
    pagination: Pagination,
  ): Promise<TPaginationResponse<AdminBankingAccount>> {
    const {
      branchNumber,
      accountNumber,
      accountDigit,
      bankName,
      bankCode,
      createdAtStart,
      createdAtEnd,
    } = filter;

    const where = {
      ...(branchNumber && { branchNumber }),
      ...(accountNumber && { accountNumber }),
      ...(accountDigit && { accountDigit }),
      ...(bankName && { bankName: { [Op.iLike]: `%${bankName}%` } }),
      ...(bankCode && { bankCode }),
      ...(createdAtStart &&
        createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
      enabled: true,
    };

    return AdminBankingAccountModel.findAndCountAll<AdminBankingAccountModel>({
      where,
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(AdminBankingAccountDatabaseRepository.toDomain),
      ),
    );
  }
}
