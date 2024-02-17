import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  getMoment,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import {
  CashOutSolicitation,
  CashOutSolicitationRepository,
  Company,
} from '@zro/pix-zro-pay/domain';
import { CashOutSolicitationModel } from '@zro/pix-zro-pay/infrastructure';

export class CashOutSolicitationDatabaseRepository
  extends DatabaseRepository
  implements CashOutSolicitationRepository
{
  static toDomain(
    cashOutSolicitationModel: CashOutSolicitationModel,
  ): CashOutSolicitation {
    return cashOutSolicitationModel?.toDomain() ?? null;
  }

  async create(
    cashOutSolicitation: CashOutSolicitation,
  ): Promise<CashOutSolicitation> {
    const cashOutSolicitationGenerated =
      await CashOutSolicitationModel.create<CashOutSolicitationModel>(
        cashOutSolicitation,
        {
          transaction: this.transaction,
        },
      );

    cashOutSolicitation.id = cashOutSolicitationGenerated.id;
    cashOutSolicitation.createdAt = cashOutSolicitationGenerated.createdAt;
    return cashOutSolicitation;
  }

  async update(
    cashOutSolicitation: CashOutSolicitation,
  ): Promise<CashOutSolicitation> {
    await CashOutSolicitationModel.update<CashOutSolicitationModel>(
      cashOutSolicitation,
      {
        where: { id: cashOutSolicitation.id },
        transaction: this.transaction,
      },
    );

    return cashOutSolicitation;
  }

  async getById(id: number): Promise<CashOutSolicitation> {
    return CashOutSolicitationModel.findOne<CashOutSolicitationModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(CashOutSolicitationDatabaseRepository.toDomain);
  }

  async getByCompany(company: Company): Promise<CashOutSolicitation> {
    return CashOutSolicitationModel.findOne<CashOutSolicitationModel>({
      where: {
        companyId: company.id,
      },
      transaction: this.transaction,
    }).then(CashOutSolicitationDatabaseRepository.toDomain);
  }

  async getAll(
    pagination: Pagination,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
  ): Promise<TPaginationResponse<CashOutSolicitation>> {
    return CashOutSolicitationModel.findAndCountAll<CashOutSolicitationModel>({
      where: {
        ...(createdAtPeriodStart &&
          createdAtPeriodEnd && {
            createdAt: {
              [Op.between]: [
                getMoment(createdAtPeriodStart).startOf('day').toISOString(),
                getMoment(createdAtPeriodEnd).endOf('day').toISOString(),
              ],
            },
          }),
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(CashOutSolicitationDatabaseRepository.toDomain),
      ),
    );
  }
}
