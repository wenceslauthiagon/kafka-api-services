import {
  DatabaseRepository,
  Pagination,
  PaginationEntity,
  PaginationOrder,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  ReportUser,
  ReportUserRepository,
  ReportUserSort,
  TGetAllGeneratorFilter,
} from '@zro/reports/domain';
import { ReportUserModel } from '@zro/reports/infrastructure';

export class ReportUserDatabaseRepository
  extends DatabaseRepository
  implements ReportUserRepository
{
  static toDomain(reportUserModel: ReportUserModel): ReportUser {
    return reportUserModel?.toDomain() ?? null;
  }

  async create(reportUser: ReportUser): Promise<ReportUser> {
    const reportUserGenerated = await ReportUserModel.create<ReportUserModel>(
      reportUser,
      {
        transaction: this.transaction,
      },
    );

    reportUser.createdAt = reportUserGenerated.createdAt;
    reportUser.updatedAt = reportUserGenerated.updatedAt;
    return reportUser;
  }

  async update(reportUser: ReportUser): Promise<ReportUser> {
    await ReportUserModel.update<ReportUserModel>(reportUser, {
      where: { id: reportUser.id },
      transaction: this.transaction,
    });

    return reportUser;
  }

  async getById(id: string): Promise<ReportUser> {
    return ReportUserModel.findOne<ReportUserModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(ReportUserDatabaseRepository.toDomain);
  }

  async getByUser(user: User): Promise<ReportUser> {
    return ReportUserModel.findOne<ReportUserModel>({
      where: {
        userId: user.uuid,
      },
      transaction: this.transaction,
    }).then(ReportUserDatabaseRepository.toDomain);
  }

  async *getAllGeneratorByFilter(
    filter?: TGetAllGeneratorFilter,
  ): AsyncGenerator<ReportUser> {
    let page = 1;
    const pageSize = 100;
    const pagination = new PaginationEntity({
      page,
      pageSize,
      sort: ReportUserSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    let reportsUsersPaginated = await this._getPaginated(pagination, filter);

    while (page <= reportsUsersPaginated.pageTotal) {
      for (const reportUser of reportsUsersPaginated.data) {
        yield reportUser;
      }

      page += 1;

      if (page <= reportsUsersPaginated.pageTotal) {
        const pagination = new PaginationEntity({ page, pageSize });

        reportsUsersPaginated = await this._getPaginated(
          {
            ...pagination,
            page,
          },
          filter,
        );
      }
    }
  }

  private _getPaginated(
    pagination: Pagination,
    filter: TGetAllGeneratorFilter = {},
  ) {
    const { type } = filter;

    return ReportUserModel.findAndCountAll<ReportUserModel>({
      ...paginationWhere(pagination),
      where: {
        ...(type && { type }),
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ReportUserDatabaseRepository.toDomain),
      ),
    );
  }
}
