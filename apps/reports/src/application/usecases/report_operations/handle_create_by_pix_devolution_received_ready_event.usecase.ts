import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, TransactionType } from '@zro/operations/domain';
import {
  OperationType,
  ReportOperation,
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import { OperationService } from '@zro/reports/application';
import {
  CurrencyNotFoundException,
  OperationNotFoundException,
  TransactionTypeNotFoundException,
} from '@zro/operations/application';

export class HandleCreateReportOperationByPixDevolutionReceivedReadyEventUseCase {
  constructor(
    private logger: Logger,
    private readonly reportOperationRepository: ReportOperationRepository,
    private readonly operationService: OperationService,
    private readonly operationCurrencyTag: string,
    private readonly zroBankIspb: string,
  ) {
    this.logger = logger.child({
      context:
        HandleCreateReportOperationByPixDevolutionReceivedReadyEventUseCase.name,
    });
  }

  async execute(
    id: string,
    operation: Operation,
    transactionType: TransactionType,
    thirdPart: User,
    thirdPartBankCode: string,
    thirdPartBranch: string,
    thirdPartAccountNumber: string,
    client: User,
    clientBranch: string,
    clientAccountNumber: string,
  ): Promise<ReportOperation> {
    // Data input check
    if (
      !id ||
      !operation?.id ||
      !transactionType?.tag ||
      !client?.uuid ||
      !client?.document ||
      !clientBranch ||
      !clientAccountNumber
    ) {
      throw new MissingDataException([
        ...(!id ? ['Devolution Received ID'] : []),
        ...(!operation?.id ? ['Operation ID'] : []),
        ...(!transactionType?.tag ? ['Transaction Tag'] : []),
        ...(!client?.uuid ? ['Client ID'] : []),
        ...(!client?.document ? ['Client Document'] : []),
        ...(!clientBranch ? ['Client Branch'] : []),
        ...(!clientAccountNumber ? ['Client Account Number'] : []),
      ]);
    }

    // Indepotent
    const reportOperation = await this.reportOperationRepository.getById(id);

    this.logger.debug('Check if report operation exists.', {
      reportOperation,
    });

    if (reportOperation) {
      return reportOperation;
    }

    const transactionTypeFound =
      await this.operationService.getTransactionTypeByTag(transactionType.tag);

    this.logger.debug('Transaction type found.', {
      transactionType: transactionTypeFound,
    });

    if (!transactionTypeFound) {
      throw new TransactionTypeNotFoundException({ tag: transactionType.tag });
    }

    const operationFound = await this.operationService.getOperationById(
      operation.id,
    );

    this.logger.debug('Operation found.', {
      operation: operationFound,
    });

    if (!operationFound) {
      throw new OperationNotFoundException(operation.id);
    }

    const currencyFound = await this.operationService.getCurrencyByTag(
      this.operationCurrencyTag,
    );

    this.logger.debug('Currency found.', {
      currency: currencyFound,
    });

    if (!currencyFound) {
      throw new CurrencyNotFoundException({ tag: this.operationCurrencyTag });
    }

    const newReportOperation = new ReportOperationEntity({
      id,
      operation: operationFound,
      operationType: OperationType.C,
      transactionType: transactionTypeFound,
      thirdPart,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
      client,
      clientBankCode: this.zroBankIspb,
      clientBranch,
      clientAccountNumber,
      currency: currencyFound,
    });

    await this.reportOperationRepository.create(newReportOperation);

    this.logger.debug(
      'Added new report operation by pix devolution received ready.',
      {
        reportOperation: newReportOperation,
      },
    );

    return newReportOperation;
  }
}
