import { Transaction, Op } from 'sequelize';
import { isBoolean, isString } from 'class-validator';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { BankTed, BankTedRepository } from '@zro/banking/domain';
import { BankTedModel } from '@zro/banking/infrastructure';

export class BankTedDatabaseRepository
  extends DatabaseRepository
  implements BankTedRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(bankTedModel: BankTedModel): BankTed {
    return bankTedModel?.toDomain() ?? null;
  }

  async create(bankTed: BankTed): Promise<BankTed> {
    const createdBankTed = await BankTedModel.create<BankTedModel>(bankTed, {
      transaction: this.transaction,
    });

    bankTed.active = createdBankTed.active;
    bankTed.createdAt = createdBankTed.createdAt;

    return bankTed;
  }

  async update(bankTed: BankTed): Promise<BankTed> {
    await BankTedModel.update<BankTedModel>(bankTed, {
      where: { id: bankTed.id },
      paranoid: false,
      transaction: this.transaction,
    });

    return bankTed;
  }

  async delete(bankTed: BankTed): Promise<number> {
    return BankTedModel.destroy<BankTedModel>({
      where: { id: bankTed.id },
      transaction: this.transaction,
    });
  }

  async getAll(): Promise<BankTed[]> {
    return BankTedModel.findAll<BankTedModel>({
      transaction: this.transaction,
    }).then((res) => res.map(BankTedDatabaseRepository.toDomain));
  }

  async getAllWithDeletedAt(): Promise<BankTed[]> {
    return BankTedModel.findAll<BankTedModel>({
      paranoid: false,
      transaction: this.transaction,
    }).then((res) => res.map(BankTedDatabaseRepository.toDomain));
  }

  async getBySearchAndActive(
    pagination: Pagination,
    search?: string,
    active?: boolean,
  ): Promise<TPaginationResponse<BankTed>> {
    return BankTedModel.findAndCountAll<BankTedModel>({
      where: {
        ...(isBoolean(active) && { active }),
        ...(isString(search) && {
          [Op.or]: [
            { code: { [Op.iLike]: `%${search}%` } },
            { ispb: { [Op.iLike]: `%${search}%` } },
            { name: { [Op.iLike]: `%${search}%` } },
          ],
        }),
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(BankTedDatabaseRepository.toDomain),
      ),
    );
  }

  async getById(id: string): Promise<BankTed> {
    return BankTedModel.findOne<BankTedModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankTedDatabaseRepository.toDomain);
  }

  async getByCode(code: string): Promise<BankTed> {
    return BankTedModel.findOne<BankTedModel>({
      where: { code },
      transaction: this.transaction,
    }).then(BankTedDatabaseRepository.toDomain);
  }
}
