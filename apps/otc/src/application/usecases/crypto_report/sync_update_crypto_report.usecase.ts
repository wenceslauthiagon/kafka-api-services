import { Logger } from 'winston';
import {
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
  Pagination,
  PaginationOrder,
  getMoment,
} from '@zro/common';
import {
  CryptoReport,
  CryptoReportCurrentPageEntity,
  CryptoReportCurrentPageRepository,
  CryptoReportRepository,
  CryptoReportRequestSort,
} from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import {
  HistoricalCryptoPriceGateway,
  OperationService,
  HistoricalCryptoPriceGatewayException,
  QuotationService,
} from '@zro/otc/application';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';

export class SyncUpdateCryptoReportUseCase {
  private newUpdates: CryptoReport[] = [];

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param cryptoReportRepository Crypto Report Repository.
   * @param cryptoReportCurrentPageRepository Crypto Report Current Page Repository.
   * @param historicalCryptoPriceGateway Historical Crypto Price Gateway.
   * @param pageSize Page size.
   */
  constructor(
    private logger: Logger,
    private readonly cryptoReportRepository: CryptoReportRepository,
    private readonly cryptoReportCurrentPageRepository: CryptoReportCurrentPageRepository,
    private readonly historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
    private readonly pageSize: number,
  ) {
    this.logger = logger.child({
      context: SyncUpdateCryptoReportUseCase.name,
    });
  }

  /**
   * Update crypto report in database with calculations.
   */
  async execute(): Promise<void> {
    let currentPage =
      await this.cryptoReportCurrentPageRepository.getCurrentPage();

    this.logger.debug('Current page found.', {
      currentPage,
    });

    // If no createdAt is found, start from 2020, when Zro started operating crypto transactions.
    const createdAtStart =
      currentPage?.lastUpdatedCryptoReportCreatedAt ||
      getMoment('2020-01-01').toDate();

    const pagination: Pagination = {
      page: 1,
      pageSize: this.pageSize,
      sort: CryptoReportRequestSort.CREATED_AT,
      order: PaginationOrder.ASC,
    };

    const transactions = await this.cryptoReportRepository.getAllFromDate(
      createdAtStart,
      pagination,
    );

    // If no transactions are found, terminate this cron job
    if (!transactions?.data?.length) return;

    for (let i = 0; i < transactions.data.length; i++) {
      const transaction = transactions.data[i];

      if (currentPage?.lastUpdatedCryptoReportId === transaction.id) continue;

      const currency = await this.operationService.getCurrencyById(
        transaction.crypto.id,
      );

      this.logger.debug('Currency found.', {
        currency,
      });

      if (!currency) {
        throw new CurrencyNotFoundException(transaction.crypto);
      }

      let lastTransaction = null;

      for (let i = 0; i < this.newUpdates?.length; i++) {
        if (
          this.newUpdates[i].user.uuid === transaction.user.uuid &&
          this.newUpdates[i].crypto.id === transaction.crypto.id
        ) {
          lastTransaction = this.newUpdates[i];

          // Remove transaction from array to be updated and inserted again
          this.newUpdates.splice(i, 1);
          break;
        }
      }

      if (!lastTransaction)
        lastTransaction =
          await this.cryptoReportRepository.getLastBeforeDateByUserAndCurrency(
            transaction.user,
            currency,
            transaction.createdAt,
          );

      this.logger.debug('Last crypto report found.', {
        lastTransaction,
      });

      const analysedTransaction = await this.analyseTransaction(
        transaction,
        lastTransaction,
        currency,
      );

      currentPage = new CryptoReportCurrentPageEntity({
        lastUpdatedCryptoReportId: analysedTransaction.id,
        lastUpdatedCryptoReportCreatedAt: analysedTransaction.createdAt,
      });
    }

    // Update current page
    await this.cryptoReportCurrentPageRepository.createOrUpdate(currentPage);

    return;
  }

  async analyseTransaction(
    transaction: CryptoReport,
    lastTransaction: CryptoReport,
    currency: Currency,
  ): Promise<CryptoReport> {
    // If crypto price changes, update all calculations
    let update = false;

    // If there is no price, estimate price based on creation date
    if (!transaction.cryptoPrice) {
      // If transaction occurred today, get price from quotation service, otherwise get price from gateway.
      const createdAt = getMoment(transaction.createdAt);
      const today = getMoment();
      const isToday = createdAt.isSame(today, 'day');

      let price = null;

      if (isToday) {
        const quotation =
          await this.quotationService.getStreamQuotationByBaseCurrency(
            currency,
          );

        this.logger.debug('Stream quotation found.', {
          streamQuotation: {
            baseCurrency: quotation?.baseCurrency,
            quoteCurrency: quotation?.quoteCurrency,
            buy: quotation?.buy,
            sell: quotation?.sell,
          },
        });

        if (!quotation?.buy || !quotation?.sell) {
          throw new StreamQuotationNotFoundException({
            baseCurrency: currency,
          });
        }

        price = formatValueFromFloatToInt((quotation.buy + quotation.sell) / 2);
      } else {
        const gatewayResponse =
          await this.historicalCryptoPriceGateway.getHistoricalCryptoPrice({
            currency,
            createdAt: transaction.createdAt,
          });

        this.logger.debug('Estimated crypto price found.', {
          date: transaction.createdAt,
          estimatedPrice: gatewayResponse?.estimatedPrice,
        });

        if (!gatewayResponse?.estimatedPrice) {
          throw new HistoricalCryptoPriceGatewayException();
        }

        price = gatewayResponse.estimatedPrice;
      }

      transaction.cryptoPrice = price;
      transaction.fiatAmount = formatValueFromFloatToInt(
        transaction.cryptoPrice *
          formatValueFromIntToFloat(transaction.cryptoAmount, currency.decimal),
        0,
      );
      // Since price is estimated, set accurate price to false
      transaction.accuratePrice = false;

      update = true;
    }

    if (
      update ||
      !transaction.avgPrice ||
      !transaction.cryptoBalance ||
      !transaction.profit ||
      !transaction.loss ||
      !transaction.profitLossPercentage
    ) {
      // Transaction is the first transaction
      if (!lastTransaction) {
        // Avarage price calculation
        transaction.avgPrice = transaction.isTypeBeneficiary()
          ? transaction.cryptoPrice
          : 0;
        // Crypto balance calculation
        transaction.cryptoBalance = transaction.isTypeBeneficiary()
          ? transaction.cryptoAmount
          : -transaction.cryptoAmount;
        // Profit calculation
        transaction.profit =
          transaction.isTypeBeneficiary() || transaction.cryptoBalance < 0
            ? 0
            : transaction.fiatAmount -
              transaction.cryptoAmount * transaction.avgPrice;
        // Loss calculation
        transaction.loss = transaction.isTypeBeneficiary()
          ? 0
          : transaction.fiatAmount - transaction.profit;
        // Profit/Loss calculation
        transaction.profitLossPercentage = transaction.isTypeBeneficiary()
          ? 0
          : (transaction.profit * 10000) / transaction.loss;
      }

      if (lastTransaction) {
        // Crypto balance calculation
        transaction.cryptoBalance = transaction.isTypeBeneficiary()
          ? lastTransaction.cryptoBalance + transaction.cryptoAmount
          : lastTransaction.cryptoBalance - transaction.cryptoAmount;

        // Avarage price calculation
        if (transaction.isTypeBeneficiary() && !lastTransaction.avgPrice) {
          transaction.avgPrice = transaction.cryptoPrice;
        } else if (
          transaction.isTypeBeneficiary() &&
          lastTransaction.avgPrice
        ) {
          transaction.avgPrice = formatValueFromFloatToInt(
            (lastTransaction.avgPrice * lastTransaction.cryptoBalance +
              transaction.cryptoAmount * transaction.cryptoPrice) /
              transaction.cryptoBalance,
            0,
          );
        } else transaction.avgPrice = lastTransaction.avgPrice;

        // Profit calculation
        transaction.profit =
          transaction.isTypeBeneficiary() || transaction.cryptoBalance < 0
            ? 0
            : formatValueFromFloatToInt(
                transaction.fiatAmount -
                  formatValueFromIntToFloat(
                    transaction.cryptoAmount,
                    currency.decimal,
                  ) *
                    transaction.avgPrice,
                0,
              );
        // Loss calculation
        transaction.loss = transaction.isTypeBeneficiary()
          ? 0
          : transaction.fiatAmount - transaction.profit;
        // Profit/Loss calculation
        transaction.profitLossPercentage = transaction.isTypeBeneficiary()
          ? 0
          : formatValueFromFloatToInt(
              formatValueFromFloatToInt(transaction.profit * 100, 2) /
                transaction.loss,
              0,
            );
      }

      const updatedTransaction =
        await this.cryptoReportRepository.update(transaction);

      this.logger.debug('Crypto report updated.', {
        updatedTransaction,
      });

      this.newUpdates.push(transaction);
    }

    return transaction;
  }
}
