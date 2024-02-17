import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { HttpStatus } from '@nestjs/common';
import {
  formatToYearMonthDay,
  ForbiddenException,
  buildQueryString,
  formatBranch,
  getMoment,
} from '@zro/common';
import {
  PaymentsGatewayException,
  PAYMENTS_GATEWAY_SERVICES,
  GetTransactionStatementRequest,
  GetTransactionStatementResponse,
} from '@zro/payments-gateway/application';
import {
  TransactionRepository,
  TransactionEntity,
  Transaction,
  TransactionCurrentPageRepository,
  TransactionCurrentPageEntity,
  TransactionStatement,
} from '@zro/payments-gateway/domain';
import { PersonDocumentType, PersonType } from '@zro/users/domain';

export class GetTransactionUseCase {
  /**
   * The page size to request transactions from gateway.
   */
  private readonly PAGE_SIZE = 100;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param transactionRepository Transaction repository.
   * @param transactionCurrentPageRepository TransactionCurrentPage repository.
   * @param axiosInstance Axios Instance Gateway.
   */
  constructor(
    private logger: Logger,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionCurrentPageRepository: TransactionCurrentPageRepository,
    private readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({ context: GetTransactionUseCase.name });
  }

  /**
   * Get all transactions from gateway.
   */
  async execute(): Promise<Transaction[]> {
    let hasNextPage = true;
    const transactionsCreated = [];

    const currentPage =
      await this.transactionCurrentPageRepository.getCurrentPage();

    this.logger.debug('Current page found.', { currentPage });

    let actualPage = currentPage?.actualPage || 1;
    const updateDate = currentPage?.createdDate
      ? getMoment(currentPage?.createdDate).toDate()
      : getMoment().toDate();

    // Get all interval dates from currentPage?.createdDate to now
    const intervalDates = this.getIntervalDates(updateDate);

    this.logger.debug('Interval dates for run update.', { intervalDates });

    // Run first day from page getCurrentPage, the next days will start from page 1
    for (const newUpdateDate of intervalDates) {
      for (;;) {
        const newUpdateDateFormatted = formatToYearMonthDay(newUpdateDate);

        this.logger.debug(
          `Update transactions for page ${actualPage} and date ${newUpdateDateFormatted}.`,
        );

        const request: GetTransactionStatementRequest = {
          page: actualPage,
          limit: this.PAGE_SIZE,
          created_start_date: getMoment(newUpdateDateFormatted)
            .startOf('d')
            .format('YYYY-MM-DD HH:mm:ss'),
          created_end_date: getMoment(newUpdateDateFormatted)
            .endOf('d')
            .format('YYYY-MM-DD HH:mm:ss'),
        };

        const result = await this.getTransactionsRequest(request);

        if (result.length) {
          this.logger.debug('Found transactions length.', {
            transactions: result.length,
          });

          const newTransaction = new TransactionEntity({
            page: actualPage,
            size: result.length,
            createdDate: newUpdateDateFormatted,
            transactions: result,
          });

          await this.transactionRepository.create(newTransaction);
          transactionsCreated.push(newTransaction);

          this.logger.debug('Create transactions.', { newTransaction });

          hasNextPage = result.length >= this.PAGE_SIZE;

          const newCurrentPage = new TransactionCurrentPageEntity({
            actualPage,
            createdDate: newUpdateDateFormatted,
          });

          await this.transactionCurrentPageRepository.createOrUpdate(
            newCurrentPage,
          );

          actualPage++;
        } else {
          hasNextPage = false;
        }

        // When finish update for the first day, the next day will start with page 1
        if (!hasNextPage) {
          actualPage = 1;
          break;
        }
      }
    }

    return transactionsCreated;
  }

  private getIntervalDates(actualDate: Date) {
    const startDate = getMoment(actualDate);
    const endDate = getMoment();
    const dates = [startDate.toDate()];

    while (startDate.add(1, 'days').diff(endDate) < 0) {
      dates.push(startDate.clone().toDate());
    }

    return dates;
  }

  private async getTransactionsRequest(
    request: GetTransactionStatementRequest,
  ): Promise<TransactionStatement[]> {
    this.logger.debug('Get transaction request.', { request });

    try {
      const { data } =
        await this.axiosInstance.get<GetTransactionStatementResponse>(
          buildQueryString(PAYMENTS_GATEWAY_SERVICES.TRANSACTION, request),
        );

      this.logger.debug('Response found.', { data });

      if (!data.data?.length) return [];

      const response = data.data.map(
        (res) =>
          new TransactionStatement({
            operationId: res.operation_id,
            operationDate: getMoment(res.operation_date).toDate(),
            operationValue: res.operation_value,
            operationType: res.operation_type,
            transactionTypeTag: res.transaction_type_tag,
            thirdPartName: res.third_part_name,
            thirdPartDocument: res.third_part_document,
            thirdPartTypeDocument:
              res.third_part_type_document === PersonDocumentType.CPF
                ? PersonType.NATURAL_PERSON
                : PersonType.LEGAL_PERSON,
            clientName: res.client_name,
            clientDocument: res.client_document,
            clientTypeDocument:
              res.client_type_document === PersonDocumentType.CPF
                ? PersonType.NATURAL_PERSON
                : PersonType.LEGAL_PERSON,
            clientBankCode: res.client_bank_code,
            clientBranch: formatBranch(res.client_branch),
            clientAccountNumber: res.client_account_number,
            currencySymbol: res.currency_symbol,
          }),
      );

      this.logger.info('Get transaction response.', {
        response,
      });

      return response;
    } catch (error) {
      if (
        error.isAxiosError &&
        error.response.status === HttpStatus.FORBIDDEN
      ) {
        throw new ForbiddenException(error.response.data);
      }

      this.logger.error('Unexpected payments gateway error.', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PaymentsGatewayException(error);
    }
  }
}
