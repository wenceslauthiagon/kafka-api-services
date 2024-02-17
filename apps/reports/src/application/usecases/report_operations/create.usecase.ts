import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency, Operation, TransactionType } from '@zro/operations/domain';
import {
  OperationType,
  ReportOperation,
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';

export class CreateReportOperationUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportOperationRepository ReportOperation repository.
   */
  constructor(
    private logger: Logger,
    private readonly reportOperationRepository: ReportOperationRepository,
  ) {
    this.logger = logger.child({
      context: CreateReportOperationUseCase.name,
    });
  }

  async execute(
    id: string,
    operation: Operation,
    operationType: OperationType,
    transactionType: TransactionType,
    thirdPart: User,
    thirdPartBankCode: string,
    thirdPartBranch: string,
    thirdPartAccountNumber: string,
    client: User,
    clientBankCode: string,
    clientBranch: string,
    clientAccountNumber: string,
    currency: Currency,
  ): Promise<ReportOperation> {
    // Data input check
    if (
      !id ||
      !operation?.id ||
      !operation?.createdAt ||
      !operation?.value ||
      !operationType ||
      !transactionType?.id ||
      !transactionType?.tag ||
      !transactionType?.title ||
      !client?.uuid ||
      !client?.document ||
      !clientBankCode ||
      !clientBranch ||
      !clientAccountNumber
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!operation?.id ? ['Operation ID'] : []),
        ...(!operation?.createdAt ? ['Operation Date'] : []),
        ...(!operation?.value ? ['Operation Value'] : []),
        ...(!operationType ? ['Operation Type'] : []),
        ...(!transactionType?.id ? ['Transaction ID'] : []),
        ...(!transactionType?.tag ? ['Transaction Tag'] : []),
        ...(!transactionType?.title ? ['Transaction Title'] : []),
        ...(!client?.uuid ? ['Client ID'] : []),
        ...(!client?.document ? ['Client Document'] : []),
        ...(!clientBankCode ? ['Client Bank Code'] : []),
        ...(!clientBranch ? ['Client Branch'] : []),
        ...(!clientAccountNumber ? ['Client Account Number'] : []),
      ]);
    }

    const reportOperation =
      await this.reportOperationRepository.getByOperationAndClientAccountNumberAndOperationType(
        operation,
        clientAccountNumber,
        operationType,
      );

    this.logger.debug('Check if report operation exists.', {
      reportOperation,
    });

    if (reportOperation) {
      return reportOperation;
    }

    const newReportOperation = new ReportOperationEntity({
      id,
      operation,
      operationType,
      transactionType,
      thirdPart,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
      client,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currency,
    });

    const reportOperationCreated =
      await this.reportOperationRepository.create(newReportOperation);

    this.logger.debug('Added new report operation.', {
      reportOperation: reportOperationCreated,
    });

    return reportOperationCreated;
  }
}
