import {
  Currency,
  CurrencyRepository,
  Operation,
  OperationRepository,
  TGetAllOperationsGeneratorFilter,
  WalletAccount,
  WalletAccountRepository,
} from '@zro/operations/domain';
import {
  ReportService,
  UserService,
  CurrencyNotFoundException,
} from '@zro/operations/application';
import { Logger } from 'winston';
import {
  OperationType,
  ReportOperation,
  ReportOperationEntity,
  SyncOperationsReportsFilter,
} from '@zro/reports/domain';
import { User } from '@zro/users/domain';
import { v4 as uuidV4 } from 'uuid';

export class SyncOperationsReportsUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationRepository Operation repository.
   * @param currencyRepository Currency repository.
   * @param reportService Report service.
   * @param userService User service.
   * @param transactionTypes Transaction type.
   * @param bankCode Bank code.
   * @param currencySymbol Currency symbol.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly reportService: ReportService,
    private readonly userService: UserService,
    private readonly transactionTypes: string,
    private readonly bankCode: string,
    private readonly currencySymbol: string,
  ) {
    this.logger = logger.child({
      context: SyncOperationsReportsUseCase.name,
    });
  }

  async execute(params: SyncOperationsReportsFilter): Promise<void> {
    const currency = await this.currencyRepository.getBySymbol(
      this.currencySymbol,
    );

    this.logger.debug('Currency found.', { currency });

    if (!currency) {
      throw new CurrencyNotFoundException({
        symbol: this.currencySymbol,
      });
    }

    // Get tags in array format
    const transactionTags = this.transactionTypes.split(';');

    for (const tag of transactionTags) {
      const filter = this.getFilter(params, tag, currency);

      this.logger.debug('Get operations by filter', { filter });

      for await (const operations of this.operationRepository.getAllByFilterGenerator(
        filter,
      )) {
        this.logger.debug('Found operations by filter', {
          filter,
          operations: operations.length,
        });

        for (const operation of operations) {
          try {
            if (this.hasOwner(operation) && this.hasBeneficiary(operation)) {
              this.logger.debug('Call for create both report', {
                operation,
              });

              const reports = await this.createBothReport(currency, operation);

              for (const report of reports) {
                this.logger.debug('Send both report');

                await this.reportService.createOperationReport(report);
              }

              continue;
            }

            if (this.hasOwner(operation)) {
              this.logger.debug('Call for owner report', {
                operation,
              });

              const reportOperation = await this.createOwnerReport(
                currency,
                operation,
              );

              this.logger.debug('Send owner report');

              await this.reportService.createOperationReport(reportOperation);

              continue;
            }

            if (this.hasBeneficiary(operation)) {
              this.logger.debug('Call for beneficiary report', {
                operation,
              });

              const reportOperation = await this.createBeneficiaryReport(
                currency,
                operation,
              );

              this.logger.debug('Send beneficiary report');

              await this.reportService.createOperationReport(reportOperation);

              continue;
            }
          } catch (error) {
            this.logger.debug(
              `Error with sync ${this.transactionTypes} reports.`,
              {
                operation,
                error,
              },
            );

            continue;
          }
        }
      }
    }
  }

  private getFilter(
    params: SyncOperationsReportsFilter,
    transactionTag: string,
    currency: Currency,
  ): TGetAllOperationsGeneratorFilter {
    return {
      transactionTag: transactionTag,
      createdAtStart: params.createdAtStart,
      createdAtEnd: params.createdAtEnd,
      currencyId: currency.id,
      nonChargeback: true,
    };
  }

  private hasOwner(operation: Operation): boolean {
    return operation.owner?.id && true;
  }

  private hasBeneficiary(operation: Operation): boolean {
    return operation.beneficiary?.id && true;
  }

  private async getClient(id: User['id']): Promise<User> {
    return this.userService.getUserById(id);
  }

  private async getClientWalletAccount(
    client: User,
    currency: Currency,
  ): Promise<WalletAccount> {
    return this.walletAccountRepository.getByUserAndCurrency(client, currency);
  }

  private createReport(
    operation: Operation,
    operationType: OperationType,
    client: User,
    clientWalletAccount: WalletAccount,
    currency: Currency,
    thirdPart?: User,
    thirdPartWalletAccount?: WalletAccount,
  ): ReportOperation {
    return new ReportOperationEntity({
      id: uuidV4(),
      operation,
      operationType,
      transactionType: operation.transactionType,
      ...(thirdPart && { thirdPart }),
      ...(thirdPart && { thirdPartBankCode: this.bankCode }),
      ...(thirdPartWalletAccount && {
        thirdPartBranch: thirdPartWalletAccount.branchNumber,
      }),
      ...(thirdPartWalletAccount && {
        thirdPartAccountNumber: thirdPartWalletAccount.accountNumber,
      }),
      client,
      clientBankCode: this.bankCode,
      clientBranch: clientWalletAccount.branchNumber,
      clientAccountNumber: clientWalletAccount.accountNumber,
      currency,
    });
  }

  private async createOwnerReport(
    currency: Currency,
    operation: Operation,
  ): Promise<ReportOperation> {
    const client = await this.getClient(operation.owner.id);
    const clientWalletAccount = await this.getClientWalletAccount(
      client,
      currency,
    );

    return this.createReport(
      operation,
      OperationType.D,
      client,
      clientWalletAccount,
      currency,
    );
  }

  private async createBeneficiaryReport(
    currency: Currency,
    operation: Operation,
  ): Promise<ReportOperation> {
    const client = await this.getClient(operation.beneficiary.id);
    const clientWalletAccount = await this.getClientWalletAccount(
      client,
      currency,
    );

    return this.createReport(
      operation,
      OperationType.C,
      client,
      clientWalletAccount,
      currency,
    );
  }

  private async createBothReport(
    currency: Currency,
    operation: Operation,
  ): Promise<ReportOperation[]> {
    const owner = await this.getClient(operation.owner.id);
    const ownerWalletAccount = await this.getClientWalletAccount(
      owner,
      currency,
    );

    const beneficiary = await this.getClient(operation.beneficiary.id);
    const beneficiaryWalletAccount = await this.getClientWalletAccount(
      beneficiary,
      currency,
    );

    const ownerReport = this.createReport(
      operation,
      OperationType.D,
      owner,
      ownerWalletAccount,
      currency,
      beneficiary,
      beneficiaryWalletAccount,
    );

    const beneficiaryReport = this.createReport(
      operation,
      OperationType.C,
      beneficiary,
      beneficiaryWalletAccount,
      currency,
      owner,
      ownerWalletAccount,
    );

    return [ownerReport, beneficiaryReport];
  }
}
