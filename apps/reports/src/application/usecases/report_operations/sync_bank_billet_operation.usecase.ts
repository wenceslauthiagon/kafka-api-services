import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  OperationType,
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import { OperationService } from '@zro/reports/application';
import {
  CurrencyNotFoundException,
  TransactionTypeNotFoundException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';
import {
  Currency,
  Operation,
  OperationRequestSort,
  TGetOperationsFilter,
  TransactionType,
} from '@zro/operations/domain';
import { PaginationOrder, getMoment } from '@zro/common';

/**
 * SyncBankBilletOperationUseCase will insert into ReportOperationRepository all last day's operations relabankBillet to bank billet transactions.
 */
export class SyncBankBilletOperationUseCase {
  private readonly CREATED_AT_START = getMoment()
    .subtract(1, 'days')
    .startOf('day')
    .toDate();
  private readonly CREATED_AT_END = getMoment()
    .subtract(1, 'days')
    .endOf('day')
    .toDate();
  private readonly PAGE_SIZE = 100;
  private CURRENT_PAGE: number;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportOperationRepository ReportOperation repository.
   * @param operationService Operation service.
   * @param bankBilletOperationTags Operation transaction type tags related to bank billet transactions.
   * @param zrobankIspb Zrobank ISPB.
   * @param currencyTag Currency tag.
   */
  constructor(
    private logger: Logger,
    private readonly reportOperationRepository: ReportOperationRepository,
    private readonly operationService: OperationService,
    private readonly bankBilletOperationTags: string,
    private readonly zrobankIspb: string,
    private readonly currencyTag: string,
  ) {
    this.logger = logger.child({
      context: SyncBankBilletOperationUseCase.name,
    });
  }

  /**
   * Sync new bankBillet operations.
   */
  async execute(): Promise<void> {
    // Find currency by provided currency tag.
    const currency = await this.operationService.getCurrencyByTag(
      this.currencyTag,
    );

    this.logger.debug('Currency found.', {
      currency,
    });

    if (!currency) {
      throw new CurrencyNotFoundException({
        tag: this.currencyTag,
      });
    }

    // Get tags in array format
    const bankBilletOperationTags = this.bankBilletOperationTags.split(';');

    for (const tag of bankBilletOperationTags) {
      // Start bankBillet operations search from page 1.
      this.CURRENT_PAGE = 1;

      const transactionType =
        await this.operationService.getTransactionTypeByTag(tag);

      this.logger.debug('Transaction type found.', {
        transactionType,
      });

      if (!transactionType) {
        throw new TransactionTypeNotFoundException({
          tag,
        });
      }

      const pagination = {
        page: this.CURRENT_PAGE,
        pageSize: this.PAGE_SIZE,
        sort: OperationRequestSort.CREATED_AT,
        order: PaginationOrder.ASC,
      };

      const filter: TGetOperationsFilter = {
        transactionTag: transactionType.tag,
        createdAtStart: this.CREATED_AT_START,
        createdAtEnd: this.CREATED_AT_END,
        currencyTag: this.currencyTag,
        nonChargeback: true,
      };

      // While there are more pages to analyze the data, go on.
      let goOn = true;

      while (goOn) {
        const bankBilletOperationsPaginated =
          await this.operationService.getAllOperationsByFilter(
            pagination,
            filter,
          );

        this.logger.debug('Ted operations found.', {
          operations: bankBilletOperationsPaginated.total,
        });

        // If no bank billet operation is found, go to next tag.
        if (!bankBilletOperationsPaginated?.data?.length) {
          goOn = false;
          continue;
        }

        for (const operation of bankBilletOperationsPaginated.data) {
          // Idempotence check.
          const reportOperation =
            await this.reportOperationRepository.getByOperation(operation);

          this.logger.debug('Check if report operation exists.', {
            reportOperation,
          });

          // If report operation already exists, go to next operation.
          if (reportOperation) {
            continue;
          }

          if (transactionType.isBeneficiaryParticipantsRequired()) {
            await this.createCreditReportOperation(
              operation,
              transactionType,
              currency,
            );
          }

          if (transactionType.isOwnerParticipantsRequired()) {
            await this.createDebitReportOperation(
              operation,
              transactionType,
              currency,
            );
          }
        }

        bankBilletOperationsPaginated.page <
        bankBilletOperationsPaginated.pageTotal
          ? (pagination.page += 1)
          : (goOn = false);
      }
    }
  }

  private async createDebitReportOperation(
    operation: Operation,
    transactionType: TransactionType,
    currency: Currency,
  ): Promise<void> {
    const clientWalletAccount =
      await this.operationService.getWalletAccountByUserAndCurrency(
        operation.owner,
        currency,
      );

    this.logger.debug('Found client wallet account.', {
      walletAccount: clientWalletAccount,
    });

    if (!clientWalletAccount) {
      throw new WalletAccountNotFoundException({
        currency,
      });
    }

    const newReportOperation = new ReportOperationEntity({
      id: uuidV4(),
      operation,
      operationType: OperationType.D,
      transactionType,
      client: operation.owner,
      clientBankCode: this.zrobankIspb,
      clientBranch: clientWalletAccount.branchNumber,
      clientAccountNumber: clientWalletAccount.accountNumber,
      currency,
    });

    await this.reportOperationRepository.create(newReportOperation);

    this.logger.debug('Added new report operation.', {
      reportOperation: newReportOperation,
    });
  }

  private async createCreditReportOperation(
    operation: Operation,
    transactionType: TransactionType,
    currency: Currency,
  ): Promise<void> {
    const clientWalletAccount =
      await this.operationService.getWalletAccountByUserAndCurrency(
        operation.beneficiary,
        currency,
      );

    this.logger.debug('Found client wallet account.', {
      walletAccount: clientWalletAccount,
    });

    if (!clientWalletAccount) {
      throw new WalletAccountNotFoundException({
        currency,
      });
    }

    const newReportOperation = new ReportOperationEntity({
      id: uuidV4(),
      operation,
      operationType: OperationType.C,
      transactionType,
      client: operation.beneficiary,
      clientBankCode: this.zrobankIspb,
      clientBranch: clientWalletAccount.branchNumber,
      clientAccountNumber: clientWalletAccount.accountNumber,
      currency,
    });

    await this.reportOperationRepository.create(newReportOperation);

    this.logger.debug('Added new report operation.', {
      reportOperation: newReportOperation,
    });
  }
}
