import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import { CryptoReport, CryptoReportRepository } from '@zro/otc/domain';
import { User } from '@zro/users/domain';
import { Currency } from '@zro/operations/domain';
import { CryptoReportModel } from '@zro/otc/infrastructure';

export class CryptoReportDatabaseRepository
  extends DatabaseRepository
  implements CryptoReportRepository
{
  static toDomain(model: CryptoReportModel): CryptoReport {
    return model?.toDomain() ?? null;
  }

  async create(cryptoReport: CryptoReport): Promise<CryptoReport> {
    const createdCryptoReport =
      await CryptoReportModel.create<CryptoReportModel>(cryptoReport, {
        transaction: this.transaction,
      });

    cryptoReport.id = createdCryptoReport.id;

    return cryptoReport;
  }

  async update(cryptoReport: CryptoReport): Promise<CryptoReport> {
    await CryptoReportModel.update<CryptoReportModel>(cryptoReport, {
      where: { id: cryptoReport.id },
      transaction: this.transaction,
    });

    return cryptoReport;
  }

  async getById(id: string): Promise<CryptoReport> {
    return CryptoReportModel.findOne<CryptoReportModel>({
      where: {
        id,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(CryptoReportDatabaseRepository.toDomain);
  }

  async getLastBeforeDateByUserAndCurrency(
    user: User,
    crypto: Currency,
    createdAt: Date,
  ): Promise<CryptoReport> {
    const reports = await CryptoReportModel.findAll<CryptoReportModel>({
      where: {
        cryptoId: crypto.id,
        userId: user.uuid,
        createdAt: {
          [Op.lte]: createdAt,
        },
      },
      order: [['created_at', 'desc']],
      limit: 2,
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((data) => data.map(CryptoReportDatabaseRepository.toDomain));

    return reports[1];
  }

  async getAllByUserAndCurrency(
    user: User,
    crypto: Currency,
    createdAtStart?: Date,
    createdAtEnd?: Date,
  ): Promise<CryptoReport[]> {
    return CryptoReportModel.findAll<CryptoReportModel>({
      where: {
        cryptoId: crypto.id,
        userId: user.uuid,
        ...(createdAtStart &&
          createdAtEnd && {
            createdAt: {
              [Op.between]: [
                getMoment(createdAtStart).startOf('day').toISOString(),
                getMoment(createdAtEnd).endOf('day').toISOString(),
              ],
            },
          }),
      },
      order: [['created_at', 'asc']],
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((data) => data.map(CryptoReportDatabaseRepository.toDomain));
  }

  async getAllFromDate(
    createdAtStart: Date,
    pagination: Pagination,
  ): Promise<TPaginationResponse<CryptoReport>> {
    return CryptoReportModel.findAndCountAll<CryptoReportModel>({
      where: {
        createdAt: {
          [Op.gte]: createdAtStart,
        },
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(CryptoReportDatabaseRepository.toDomain),
      ),
    );
  }
}
