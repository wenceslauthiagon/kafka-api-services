import {
  DatabaseRepository,
  Pagination,
  PaginationEntity,
  PaginationOrder,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import {
  ReportUserConfig,
  ReportUserConfigRepository,
  ReportUserConfigSort,
} from '@zro/reports/domain';
import { ReportUserConfigModel } from '@zro/reports/infrastructure';

export class ReportUserConfigDatabaseRepository
  extends DatabaseRepository
  implements ReportUserConfigRepository
{
  static toDomain(reportUserModel: ReportUserConfigModel): ReportUserConfig {
    return reportUserModel?.toDomain() ?? null;
  }

  async getAll(): Promise<ReportUserConfig[]> {
    return ReportUserConfigModel.findAll<ReportUserConfigModel>({
      transaction: this.transaction,
    }).then((res) => res.map(ReportUserConfigDatabaseRepository.toDomain));
  }

  async *getAllGenerator(): AsyncGenerator<ReportUserConfig> {
    let page = 1;
    const pageSize = 100;
    const pagination = new PaginationEntity({
      page,
      pageSize,
      sort: ReportUserConfigSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    let reportsUsersConfigPaginated = await this._getPaginated(pagination);

    while (page <= reportsUsersConfigPaginated.pageTotal) {
      for (const reportUserConfig of reportsUsersConfigPaginated.data) {
        yield reportUserConfig;
      }

      page += 1;

      if (page <= reportsUsersConfigPaginated.pageTotal) {
        const pagination = new PaginationEntity({ page, pageSize });

        reportsUsersConfigPaginated = await this._getPaginated({
          ...pagination,
          page,
        });
      }
    }
  }

  private _getPaginated(pagination: Pagination) {
    return ReportUserConfigModel.findAndCountAll<ReportUserConfigModel>({
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ReportUserConfigDatabaseRepository.toDomain),
      ),
    );
  }
}
