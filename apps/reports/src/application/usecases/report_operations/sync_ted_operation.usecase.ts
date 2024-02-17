import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  OperationType,
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import { OperationService, BankingService } from '@zro/reports/application';
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
import { PersonType, UserEntity } from '@zro/users/domain';
import { PaginationOrder, isCpf, getMoment } from '@zro/common';
import {
  BankingTedNotFoundException,
  BankingTedReceivedNotFoundException,
} from '@zro/banking/application';

/**
 * SyncTedOperationUseCase will insert into ReportOperationRepository all last day's operations related to ted transactions.
 */
export class SyncTedOperationUseCase {
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
   * @param bankingService Banking service.
   * @param tedOperationTags Operation transaction type tags related to ted transactions.
   * @param zrobankIspb Zrobank ISPB.
   * @param currencyTag Currency tag.
   * @param tedReceiveTag Ted receive tag.
   * @param tedSentTag Ted sent tag.
   */
  constructor(
    private logger: Logger,
    private readonly reportOperationRepository: ReportOperationRepository,
    private readonly operationService: OperationService,
    private readonly bankingService: BankingService,
    private readonly tedOperationTags: string,
    private readonly zrobankIspb: string,
    private readonly currencyTag: string,
    private readonly tedReceiveTag: string,
    private readonly tedSentTag: string,
  ) {
    this.logger = logger.child({
      context: SyncTedOperationUseCase.name,
    });
  }

  /**
   * Sync new ted operations.
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
    const tedOperationTags = this.tedOperationTags.split(';');

    for (const tag of tedOperationTags) {
      // Start ted operations search from page 1.
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
        const tedOperationsPaginated =
          await this.operationService.getAllOperationsByFilter(
            pagination,
            filter,
          );

        this.logger.debug('Ted operations found.', {
          operations: tedOperationsPaginated.total,
        });

        // If no ted operation is found, go to next tag.
        if (!tedOperationsPaginated?.data?.length) {
          goOn = false;
          continue;
        }

        for (const operation of tedOperationsPaginated.data) {
          // Idempotence check.
          const reportOperation =
            await this.reportOperationRepository.getByOperation(operation);

          this.logger.debug('Check if report operation exists.', {
            reportOperation,
          });

          // If reportOperation already exists, go to next operation.
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

        tedOperationsPaginated.page < tedOperationsPaginated.pageTotal
          ? (pagination.page += 1)
          : (goOn = false);
      }
    }
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

    // If TAG is TEDRECEIVE, third part must be included
    if (transactionType.tag === this.tedReceiveTag) {
      const ted =
        await this.bankingService.getBankingTedReceivedByOperation(operation);

      this.logger.debug('Found TED.', {
        ted,
      });

      if (!ted) {
        throw new BankingTedReceivedNotFoundException({
          operation,
        });
      }

      const thirdPart = new UserEntity({
        ...(ted.ownerName && {
          name: ted.ownerName,
        }),
        ...(ted.ownerDocument && {
          document: ted.ownerDocument,
          type: isCpf(ted.ownerDocument)
            ? PersonType.NATURAL_PERSON
            : PersonType.LEGAL_PERSON,
        }),
      });

      const newReportOperation = new ReportOperationEntity({
        id: uuidV4(),
        operation,
        operationType: OperationType.C,
        transactionType,
        ...(thirdPart && {
          thirdPart,
        }),
        ...(ted.ownerBankCode && {
          thirdPartBankCode: ted.ownerBankCode,
        }),
        ...(ted.ownerBankBranch && {
          thirdPartBranch: ted.ownerBankBranch,
        }),
        ...(ted.ownerBankAccount && {
          thirdPartAccountNumber: ted.ownerBankAccount,
        }),
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

      return;
    }

    // If TAG is not TEDRECEIVE, third part do not need to be included
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

    // If TAG is TED, third part must be included
    if (transactionType.tag === this.tedSentTag) {
      const ted = await this.bankingService.getBankingTedByOperation(operation);

      this.logger.debug('Found TED.', {
        ted,
      });

      if (!ted) {
        throw new BankingTedNotFoundException({
          operation,
        });
      }

      const thirdPart = new UserEntity({
        ...(ted.beneficiaryName && {
          name: ted.beneficiaryName,
        }),
        ...(ted.beneficiaryDocument && {
          document: ted.beneficiaryDocument,
          type: isCpf(ted.beneficiaryDocument)
            ? PersonType.NATURAL_PERSON
            : PersonType.LEGAL_PERSON,
        }),
      });

      const newReportOperation = new ReportOperationEntity({
        id: uuidV4(),
        operation,
        operationType: OperationType.D,
        transactionType,
        ...(thirdPart && {
          thirdPart,
        }),
        ...(ted.beneficiaryBankCode && {
          thirdPartBankCode: ted.beneficiaryBankCode,
        }),
        ...(ted.beneficiaryAgency && {
          thirdPartBranch: ted.beneficiaryAgency,
        }),
        ...(ted.beneficiaryAccount && {
          thirdPartAccountNumber: ted.beneficiaryAccount,
        }),
        client: operation.owner,
        clientBankCode: this.zrobankIspb,
        clientBranch: clientWalletAccount.branchNumber,
        clientAccountNumber: clientWalletAccount.accountNumber,
        currency,
        createdAt: operation.createdAt,
      });

      await this.reportOperationRepository.create(newReportOperation);

      this.logger.debug('Added new report operation.', {
        reportOperation: newReportOperation,
      });

      return;
    }

    // If TAG is not TED, third part do not need to be included
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
      createdAt: operation.createdAt,
    });

    await this.reportOperationRepository.create(newReportOperation);

    this.logger.debug('Added new report operation.', {
      reportOperation: newReportOperation,
    });
  }
}
