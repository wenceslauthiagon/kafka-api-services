import { Operation } from '@zro/operations/domain';
import { OperationType, ReportOperation } from '@zro/reports/domain';

export type SyncOperationsReportsFilter = {
  createdAtStart: Date;
  createdAtEnd: Date;
};

export enum ReportOperationSort {
  CREATED_AT = 'created_at',
}

export interface ReportOperationRepository {
  /**
   * Insert a ReportOperation.
   * @param reportOperation ReportOperation to save.
   * @returns Created ReportOperation.
   */
  create: (reportOperation: ReportOperation) => Promise<ReportOperation>;

  /**
   * Update a ReportOperation.
   * @param reportOperation ReportOperation to update.
   * @returns Updated reportOperation.
   */
  update: (reportOperation: ReportOperation) => Promise<ReportOperation>;

  /**
   * get a ReportOperation by id.
   * @param id ReportOperation id to get.
   * @returns get ReportOperation.
   */
  getById: (id: string) => Promise<ReportOperation>;

  /**
   * get a ReportOperation by operation.
   * @param operation ReportOperation operation.
   * @returns get ReportOperation.
   */
  getByOperation: (operation: Operation) => Promise<ReportOperation>;

  /**
   * get a ReportOperation by operation, clientAccountNumber and operationType.
   * @param operation ReportOperation operation.
   * @param clientAccountNumber ReportOperation clientAccountNumber.
   * @param operationType ReportOperation operationType.
   * @returns get ReportOperation.
   */
  getByOperationAndClientAccountNumberAndOperationType: (
    operation: Operation,
    clientAccountNumber: string,
    operationType: OperationType,
  ) => Promise<ReportOperation>;

  /**
   * Get all report operation.
   * @returns Async generator of Report Operation.
   */
  getAllGenerator: () => AsyncGenerator<ReportOperation>;
}
