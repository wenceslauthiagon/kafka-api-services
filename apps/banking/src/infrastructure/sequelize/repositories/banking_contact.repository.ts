import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import {
  BankingContact,
  BankingContactRepository,
  TGetBankingContactFilter,
} from '@zro/banking/domain';
import {
  BankingContactModel,
  BankingAccountContactModel,
} from '@zro/banking/infrastructure';
import { User } from '@zro/users/domain';

export class BankingContactDatabaseRepository
  extends DatabaseRepository
  implements BankingContactRepository
{
  static toDomain(bankModel: BankingContactModel): BankingContact {
    return bankModel?.toDomain() ?? null;
  }

  async create(bankingContact: BankingContact): Promise<BankingContact> {
    const createdBankingContact =
      await BankingContactModel.create<BankingContactModel>(bankingContact, {
        transaction: this.transaction,
      });

    createdBankingContact.id = createdBankingContact.id;
    createdBankingContact.createdAt = createdBankingContact.createdAt;

    return createdBankingContact;
  }

  async getById(id: number): Promise<BankingContact> {
    return BankingContactModel.findOne<BankingContactModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankingContactDatabaseRepository.toDomain);
  }

  async getByUserAndDocument(
    user: User,
    document: string,
  ): Promise<BankingContact> {
    return BankingContactModel.findOne<BankingContactModel>({
      where: { userId: user.id, document },
      transaction: this.transaction,
    }).then(BankingContactDatabaseRepository.toDomain);
  }

  async getByFilterAndUserAndPagination(
    user: User,
    pagination: Pagination,
    filter: TGetBankingContactFilter,
  ): Promise<TPaginationResponse<BankingContact>> {
    const { name, document, createdAtStart, createdAtEnd } = filter;
    const where = {
      userId: user.id,
      ...(name && { name: { [Op.iLike]: `%${name}%` } }),
      ...(document && { document: { [Op.iLike]: `%${document}%` } }),
      ...(createdAtStart &&
        createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
    };

    return BankingContactModel.findAndCountAll<BankingContactModel>({
      where,
      ...paginationWhere(pagination),
      transaction: this.transaction,
      include: {
        model: BankingAccountContactModel,
        required: false,
      },
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(BankingContactDatabaseRepository.toDomain),
      ),
    );
  }

  async delete(bankingContact: BankingContact): Promise<number> {
    return BankingContactModel.destroy({
      where: { id: bankingContact.id },
      transaction: this.transaction,
    });
  }
}
