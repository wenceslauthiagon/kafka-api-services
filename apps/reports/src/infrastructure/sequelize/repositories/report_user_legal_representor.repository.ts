import {
  DatabaseRepository,
  Pagination,
  PaginationEntity,
  PaginationOrder,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { UserLegalRepresentor } from '@zro/users/domain';
import {
  ReportUserLegalRepresentor,
  ReportUserLegalRepresentorRepository,
  ReportUserLegalRepresentorSort,
} from '@zro/reports/domain';
import { ReportUserLegalRepresentorModel } from '@zro/reports/infrastructure';

export class ReportUserLegalRepresentorDatabaseRepository
  extends DatabaseRepository
  implements ReportUserLegalRepresentorRepository
{
  static toDomain(
    reportUserLegalRepresentorModel: ReportUserLegalRepresentorModel,
  ): ReportUserLegalRepresentor {
    return reportUserLegalRepresentorModel?.toDomain() ?? null;
  }

  async create(
    reportUserLegalRepresentor: ReportUserLegalRepresentor,
  ): Promise<ReportUserLegalRepresentor> {
    const reportUserLegalRepresentorGenerated =
      await ReportUserLegalRepresentorModel.create<ReportUserLegalRepresentorModel>(
        reportUserLegalRepresentor,
        {
          transaction: this.transaction,
        },
      );

    reportUserLegalRepresentor.createdAt =
      reportUserLegalRepresentorGenerated.createdAt;
    reportUserLegalRepresentor.updatedAt =
      reportUserLegalRepresentorGenerated.updatedAt;
    return reportUserLegalRepresentor;
  }

  async update(
    reportUserLegalRepresentor: ReportUserLegalRepresentor,
  ): Promise<ReportUserLegalRepresentor> {
    await ReportUserLegalRepresentorModel.update<ReportUserLegalRepresentorModel>(
      reportUserLegalRepresentor,
      {
        where: { id: reportUserLegalRepresentor.id },
        transaction: this.transaction,
      },
    );

    return reportUserLegalRepresentor;
  }

  async getById(id: string): Promise<ReportUserLegalRepresentor> {
    return ReportUserLegalRepresentorModel.findOne<ReportUserLegalRepresentorModel>(
      {
        where: {
          id,
        },
        transaction: this.transaction,
      },
    ).then(ReportUserLegalRepresentorDatabaseRepository.toDomain);
  }

  async getByUserLegalRepresentor(
    userLegalRepresentor: UserLegalRepresentor,
  ): Promise<ReportUserLegalRepresentor> {
    return ReportUserLegalRepresentorModel.findOne<ReportUserLegalRepresentorModel>(
      {
        where: {
          userLegalRepresentorId: userLegalRepresentor.id,
        },
        transaction: this.transaction,
      },
    ).then(ReportUserLegalRepresentorDatabaseRepository.toDomain);
  }

  async *getAllGenerator(): AsyncGenerator<UserLegalRepresentor> {
    let page = 1;
    const pageSize = 100;
    const pagination = new PaginationEntity({
      page,
      pageSize,
      sort: ReportUserLegalRepresentorSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    let reportsUserLegalRepresentorsPaginated =
      await this._getPaginated(pagination);

    while (page <= reportsUserLegalRepresentorsPaginated.pageTotal) {
      for (const userLegal of reportsUserLegalRepresentorsPaginated.data) {
        yield userLegal.userLegalRepresentor;
      }

      page += 1;

      if (page <= reportsUserLegalRepresentorsPaginated.pageTotal) {
        reportsUserLegalRepresentorsPaginated = await this._getPaginated({
          page,
          ...pagination,
        });
      }
    }
  }

  private _getPaginated(pagination: Pagination) {
    return ReportUserLegalRepresentorModel.findAndCountAll<ReportUserLegalRepresentorModel>(
      {
        ...paginationWhere(pagination),
        transaction: this.transaction,
      },
    ).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ReportUserLegalRepresentorDatabaseRepository.toDomain),
      ),
    );
  }
}
