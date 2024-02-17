import {
  DatabaseRepository,
  Pagination,
  PaginationEntity,
  PaginationOrder,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { Operation } from '@zro/operations/domain';
import {
  OperationType,
  ReportOperation,
  ReportOperationRepository,
  ReportOperationSort,
} from '@zro/reports/domain';
import { ReportOperationModel } from '@zro/reports/infrastructure';

export class ReportOperationDatabaseRepository
  extends DatabaseRepository
  implements ReportOperationRepository
{
  static toDomain(reportOperationModel: ReportOperationModel): ReportOperation {
    return reportOperationModel?.toDomain() ?? null;
  }

  async create(reportOperation: ReportOperation): Promise<ReportOperation> {
    const reportOperationGenerated =
      await ReportOperationModel.create<ReportOperationModel>(reportOperation, {
        transaction: this.transaction,
      });

    reportOperation.createdAt = reportOperationGenerated.createdAt;
    return reportOperation;
  }

  async update(reportOperation: ReportOperation): Promise<ReportOperation> {
    await ReportOperationModel.update<ReportOperationModel>(reportOperation, {
      where: { id: reportOperation.id },
      transaction: this.transaction,
    });

    return reportOperation;
  }

  async getById(id: string): Promise<ReportOperation> {
    return ReportOperationModel.findOne<ReportOperationModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(ReportOperationDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<ReportOperation> {
    return ReportOperationModel.findOne<ReportOperationModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(ReportOperationDatabaseRepository.toDomain);
  }

  async getByOperationAndClientAccountNumberAndOperationType(
    operation: Operation,
    clientAccountNumber: string,
    operationType: OperationType,
  ): Promise<ReportOperation> {
    return ReportOperationModel.findOne<ReportOperationModel>({
      where: {
        operationId: operation.id,
        clientAccountNumber,
        operationType,
      },
      transaction: this.transaction,
    }).then(ReportOperationDatabaseRepository.toDomain);
  }

  async *getAllGenerator(): AsyncGenerator<ReportOperation> {
    let page = 1;
    const pageSize = 100;
    const pagination = new PaginationEntity({
      page,
      pageSize,
      sort: ReportOperationSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    let reportsOperationPaginated = await this._getPaginated(pagination);

    while (page <= reportsOperationPaginated.pageTotal) {
      for (const reportOperation of reportsOperationPaginated.data) {
        yield reportOperation;
      }

      page += 1;

      if (page <= reportsOperationPaginated.pageTotal) {
        const pagination = new PaginationEntity({ page, pageSize });

        reportsOperationPaginated = await this._getPaginated({
          ...pagination,
          page,
        });
      }
    }
  }

  private _getPaginated(pagination: Pagination) {
    return ReportOperationModel.findAndCountAll<ReportOperationModel>({
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ReportOperationDatabaseRepository.toDomain),
      ),
    );
  }
}
