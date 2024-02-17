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

export class HandleCreateReportOperationByPixPaymentConfirmedEventUseCase {
  constructor(
    private logger: Logger,
    private readonly reportOperationRepository: ReportOperationRepository,
    private readonly operationService: OperationService,
    private readonly operationCurrencyTag: string,
    private readonly zroBankIspb: string,
  ) {
    this.logger = logger.child({
      context:
        HandleCreateReportOperationByPixPaymentConfirmedEventUseCase.name,
    });
  }

  async execute(
    id: string,
    operation: Operation,
    transactionType: TransactionType,
    beneficiary: User,
    beneficiaryBankCode: string,
    beneficiaryBranch: string,
    beneficiaryAccountNumber: string,
    owner: User,
    ownerBranch: string,
    ownerAccountNumber: string,
  ): Promise<ReportOperation> {
    // Data input check
    if (
      !id ||
      !operation?.id ||
      !transactionType?.tag ||
      !owner?.uuid ||
      !owner?.document ||
      !ownerBranch ||
      !ownerAccountNumber
    ) {
      throw new MissingDataException([
        ...(!id ? ['Payment ID'] : []),
        ...(!operation?.id ? ['Operation ID'] : []),
        ...(!transactionType?.tag ? ['Transaction Tag'] : []),
        ...(!owner?.uuid ? ['Owner ID'] : []),
        ...(!owner?.document ? ['Owner Document'] : []),
        ...(!ownerBranch ? ['Owner Branch'] : []),
        ...(!ownerAccountNumber ? ['Owner Account Number'] : []),
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
      operationType: OperationType.D,
      transactionType: transactionTypeFound,
      thirdPart: beneficiary,
      thirdPartBankCode: beneficiaryBankCode,
      thirdPartBranch: beneficiaryBranch,
      thirdPartAccountNumber: beneficiaryAccountNumber,
      client: owner,
      clientBankCode: this.zroBankIspb,
      clientBranch: ownerBranch,
      clientAccountNumber: ownerAccountNumber,
      currency: currencyFound,
    });

    await this.reportOperationRepository.create(newReportOperation);

    this.logger.debug('Added new report operation by pix payment confirmed.', {
      reportOperation: newReportOperation,
    });

    return newReportOperation;
  }
}
