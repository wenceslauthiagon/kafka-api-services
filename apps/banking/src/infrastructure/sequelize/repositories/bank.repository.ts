import { Transaction, Op } from 'sequelize';
import { isBoolean, isString } from 'class-validator';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';
import { BankModel } from '@zro/banking/infrastructure';

export class BankDatabaseRepository
  extends DatabaseRepository
  implements BankRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(bankModel: BankModel): Bank {
    return bankModel?.toDomain() ?? null;
  }

  async create(bank: Bank): Promise<Bank> {
    const createdBank = await BankModel.create<BankModel>(bank, {
      transaction: this.transaction,
    });

    bank.active = createdBank.active;
    bank.createdAt = createdBank.createdAt;

    return bank;
  }

  async update(bank: Bank): Promise<Bank> {
    await BankModel.update<BankModel>(bank, {
      where: { id: bank.id },
      paranoid: false,
      transaction: this.transaction,
    });

    return bank;
  }

  async delete(bank: Bank): Promise<number> {
    return BankModel.destroy<BankModel>({
      where: { id: bank.id },
      transaction: this.transaction,
    });
  }

  async getAll(): Promise<Bank[]> {
    return BankModel.findAll<BankModel>({
      transaction: this.transaction,
    }).then((res) => res.map(BankDatabaseRepository.toDomain));
  }

  async getAllWithDeletedAt(): Promise<Bank[]> {
    return BankModel.findAll<BankModel>({
      paranoid: false,
      transaction: this.transaction,
    }).then((res) => res.map(BankDatabaseRepository.toDomain));
  }

  async getBySearchAndActive(
    pagination: Pagination,
    search?: string,
    active?: boolean,
  ): Promise<TPaginationResponse<Bank>> {
    return BankModel.findAndCountAll<BankModel>({
      where: {
        ...(isBoolean(active) && { active }),
        ...(isString(search) && {
          [Op.or]: [
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
        data.rows.map(BankDatabaseRepository.toDomain),
      ),
    );
  }

  async getById(id: string): Promise<Bank> {
    return BankModel.findOne<BankModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankDatabaseRepository.toDomain);
  }

  async getByIspb(ispb: string): Promise<Bank> {
    return BankModel.findOne<BankModel>({
      where: { ispb },
      transaction: this.transaction,
    }).then(BankDatabaseRepository.toDomain);
  }
}
