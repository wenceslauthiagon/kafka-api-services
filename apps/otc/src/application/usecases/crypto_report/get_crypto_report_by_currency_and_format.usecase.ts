import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import * as fs from 'fs';
import { v4 as uuidV4 } from 'uuid';
import {
  cnpjMask,
  cpfMask,
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
  MissingDataException,
  createRandomCode,
  getMoment,
} from '@zro/common';
import {
  CryptoReport,
  CryptoReportRepository,
  CryptoReportFormatType,
} from '@zro/otc/domain';
import { File } from '@zro/storage/domain';
import { Currency } from '@zro/operations/domain';
import { PersonType, User } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  StorageService,
  CryptoTransactionsNotFoundException,
  CryptoReportNotFoundException,
  UserService,
  OperationService,
  QuotationService,
  HistoricalCryptoPriceGateway,
  HistoricalCryptoPriceGatewayException,
} from '@zro/otc/application';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  CryptoReportResultRow,
  generateCryptoReportResults,
  CryptoReportRow,
  GeneratePdfCryptoReport,
  GenerateXlsxCryptoReport,
} from '@zro/assets/otc';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';

export class GetCryptoReportByCurrencyAndFormatUseCase {
  private file: Buffer;
  private folder = 'crypto-report';

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param storageService Storage service.
   * @param axiosInstance Axios instance.
   * @param userService User service.
   * @param operationService Operation service.
   * @param quotationService Quotation service.
   * @param cryptoReportRepository Crypto report repository.
   * @param historicalCryptoPriceGateway Historical crypto price gateway.
   * @param zrobankLogoUrl Zrobank logo URL.
   */
  constructor(
    private logger: Logger,
    private readonly storageService: StorageService,
    private readonly axiosInstance: AxiosInstance,
    private readonly userService: UserService,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
    private readonly cryptoReportRepository: CryptoReportRepository,
    private readonly historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
    private readonly zrobankLogoUrl: string,
  ) {
    this.logger = logger.child({
      context: GetCryptoReportByCurrencyAndFormatUseCase.name,
    });
  }

  /**
   * Get crypto report by currency symbol and format.
   * @param user User.
   * @param currency Currency.
   * @param format Crypto report format.
   * @returns Crypto report.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    user: User,
    currency: Currency,
    format: CryptoReportFormatType,
    createdAtStart: Date,
    createdAtEnd: Date,
  ): Promise<File> {
    // Data input check
    if (!user?.uuid || !currency?.symbol || !format) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!currency?.symbol ? ['Currency Symbol'] : []),
        ...(!format ? ['Format'] : []),
      ]);
    }

    const userFound = await this.userService.getUserByUuid(user);

    this.logger.debug('User found.', { userFound });

    // Search and validate user
    if (!userFound) {
      throw new UserNotFoundException(user);
    }

    const currencyFound = await this.operationService.getCurrencyBySymbol(
      currency.symbol,
    );

    this.logger.debug('Currency found.', { currencyFound });

    // Search and validate currency
    if (!currencyFound) {
      throw new CurrencyNotFoundException(currency);
    }

    // Generate crypto report data
    const [cryptoReportData, cryptoReportResults] =
      await this.generateCryptoReportData(
        user,
        currencyFound,
        createdAtStart,
        createdAtEnd,
      );

    const fileName =
      format === CryptoReportFormatType.PDF
        ? `${createRandomCode(4)}_detalhamento-zrobank.pdf`
        : `${createRandomCode(4)}_detalhamento-zrobank.xlsx`;

    // Mask user document
    const formattedDocument =
      userFound.type === PersonType.NATURAL_PERSON
        ? cpfMask(userFound.document)
        : cnpjMask(userFound.document);

    // Generate formatted crypto report data
    format === CryptoReportFormatType.PDF
      ? await new GeneratePdfCryptoReport(
          fileName,
          cryptoReportData,
          userFound.fullName,
          formattedDocument,
          currencyFound,
          createdAtStart,
          createdAtEnd,
          cryptoReportResults,
          this.zrobankLogoUrl,
        ).execute()
      : await new GenerateXlsxCryptoReport(
          fileName,
          cryptoReportData,
          userFound.fullName,
          formattedDocument,
          currencyFound,
          createdAtStart,
          createdAtEnd,
          cryptoReportResults,
          this.zrobankLogoUrl,
        ).execute();

    try {
      this.file = fs.readFileSync(fileName);
    } catch (error) {
      this.logger.error('Error when get file', error);
      throw new CryptoReportNotFoundException(fileName);
    }

    this.logger.debug(
      'Get crypto report by currency symbol and format worksheet or pdf file',
      { fileName },
    );

    // Delete worksheet or pdf generated from disk
    fs.unlinkSync(fileName);

    // Send file to storage microservice
    const file = await this.storageService.uploadFile(
      uuidV4(),
      this.file,
      this.folder,
      fileName,
      this.axiosInstance,
    );

    if (!file) {
      throw new CryptoReportNotFoundException(fileName);
    }

    return file;
  }

  private async generateCryptoReportData(
    user: User,
    currency: Currency,
    createdAtStart: Date,
    createdAtEnd: Date,
  ): Promise<[CryptoReportRow[], CryptoReportResultRow[]]> {
    const transactions =
      await this.cryptoReportRepository.getAllByUserAndCurrency(
        user,
        currency,
        createdAtStart,
        createdAtEnd,
      );

    this.logger.debug('Crypto report transactions found.', {
      length: transactions.length,
    });

    // Check if transactions exist
    if (!transactions?.length) {
      throw new CryptoTransactionsNotFoundException();
    }

    // Check if there is any empty values to calculate
    const analysedTransactions = await this.analyseTransactions(
      transactions,
      currency,
      user,
      createdAtEnd,
    );

    const cryptoReportData: CryptoReportRow[] = analysedTransactions.map(
      (transaction) => {
        return {
          createdAt: transaction.createdAt,
          type: transaction.type,
          crypto: currency,
          cryptoAmount: transaction.cryptoAmount,
          cryptoPrice: transaction.cryptoPrice,
          fiatAmount: transaction.fiatAmount,
          avgPrice: transaction.avgPrice,
          cryptoBalance: transaction.cryptoBalance,
          profit: transaction.profit,
          loss: transaction.loss,
          profitLossPercentage: transaction.profitLossPercentage,
          accuratePrice: transaction.accuratePrice ?? true,
        };
      },
    );

    // Generate crypto report results data
    const cryptoReportResults: CryptoReportResultRow[] =
      await generateCryptoReportResults(cryptoReportData);

    return [cryptoReportData, cryptoReportResults];
  }

  // Fill empty values with calculation
  private async analyseTransactions(
    transactions: CryptoReport[],
    currency: Currency,
    user: User,
    createdAtEnd: Date,
  ): Promise<CryptoReport[]> {
    //If past transactions are included to calculate, exclude them in the end.
    const originalLength = transactions.length;
    let deleteLength = 0;

    const firstTransaction = transactions[0];

    // If first transaction doesn't have calculations, get all transactions since zrobank start date.
    if (!firstTransaction.avgPrice || !firstTransaction.cryptoBalance) {
      transactions = await this.cryptoReportRepository.getAllByUserAndCurrency(
        user,
        currency,
        getMoment('2020-01-01').toDate(),
        createdAtEnd,
      );

      deleteLength = transactions.length - originalLength;
    }

    for (let i = 0; i < transactions.length; i++) {
      // If crypto price changes, update all calculations
      let update = false;

      const actualTransaction = transactions[i];
      const lastTransaction = transactions[i - 1];

      // If there is no price, estimate price based on creation date
      if (!actualTransaction.cryptoPrice) {
        // If transaction occurred today, get price from quotation service, otherwise get price from gateway.
        const createdAt = getMoment(actualTransaction.createdAt);
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

          price = formatValueFromFloatToInt(
            (quotation.buy + quotation.sell) / 2,
          );
        } else {
          const gatewayResponse =
            await this.historicalCryptoPriceGateway.getHistoricalCryptoPrice({
              currency,
              createdAt: actualTransaction.createdAt,
            });

          this.logger.debug('Estimated crypto price found.', {
            date: actualTransaction.createdAt,
            estimatedPrice: gatewayResponse?.estimatedPrice,
          });

          if (!gatewayResponse?.estimatedPrice) {
            throw new HistoricalCryptoPriceGatewayException();
          }

          price = gatewayResponse.estimatedPrice;
        }

        actualTransaction.cryptoPrice = price;
        actualTransaction.fiatAmount = formatValueFromFloatToInt(
          actualTransaction.cryptoPrice *
            formatValueFromIntToFloat(
              actualTransaction.cryptoAmount,
              currency.decimal,
            ),
          0,
        );
        // Since price is estimated, set accurate price to false
        actualTransaction.accuratePrice = false;

        update = true;
      }

      if (
        update ||
        !actualTransaction.avgPrice ||
        !actualTransaction.cryptoBalance ||
        !actualTransaction.profit ||
        !actualTransaction.loss ||
        !actualTransaction.profitLossPercentage
      ) {
        // Transaction is the first transaction
        if (i === 0) {
          // Avarage price calculation
          actualTransaction.avgPrice = actualTransaction.isTypeBeneficiary()
            ? actualTransaction.cryptoPrice
            : 0;
          // Crypto balance calculation
          actualTransaction.cryptoBalance =
            actualTransaction.isTypeBeneficiary()
              ? actualTransaction.cryptoAmount
              : -actualTransaction.cryptoAmount;
          // Profit calculation
          actualTransaction.profit =
            actualTransaction.isTypeBeneficiary() ||
            actualTransaction.cryptoBalance < 0
              ? 0
              : actualTransaction.fiatAmount -
                actualTransaction.cryptoAmount * actualTransaction.avgPrice;
          // Loss calculation
          actualTransaction.loss = actualTransaction.isTypeBeneficiary()
            ? 0
            : actualTransaction.fiatAmount - actualTransaction.profit;
          // Profit/Loss calculation
          actualTransaction.profitLossPercentage =
            actualTransaction.isTypeBeneficiary()
              ? 0
              : (actualTransaction.profit * 100) / actualTransaction.loss;
        }

        if (i > 0) {
          // Crypto balance calculation
          actualTransaction.cryptoBalance =
            actualTransaction.isTypeBeneficiary()
              ? lastTransaction.cryptoBalance + actualTransaction.cryptoAmount
              : lastTransaction.cryptoBalance - actualTransaction.cryptoAmount;

          // Avarage price calculation
          if (
            actualTransaction.isTypeBeneficiary() &&
            !lastTransaction.avgPrice
          ) {
            actualTransaction.avgPrice = actualTransaction.cryptoPrice;
          } else if (
            actualTransaction.isTypeBeneficiary() &&
            lastTransaction.avgPrice
          ) {
            actualTransaction.avgPrice = formatValueFromFloatToInt(
              (lastTransaction.avgPrice * lastTransaction.cryptoBalance +
                actualTransaction.cryptoAmount *
                  actualTransaction.cryptoPrice) /
                actualTransaction.cryptoBalance,
              0,
            );
          } else actualTransaction.avgPrice = lastTransaction.avgPrice;

          // Profit calculation
          actualTransaction.profit =
            actualTransaction.isTypeBeneficiary() ||
            actualTransaction.cryptoBalance < 0
              ? 0
              : formatValueFromFloatToInt(
                  actualTransaction.fiatAmount -
                    formatValueFromIntToFloat(
                      actualTransaction.cryptoAmount,
                      currency.decimal,
                    ) *
                      actualTransaction.avgPrice,
                  0,
                );
          // Loss calculation
          actualTransaction.loss = actualTransaction.isTypeBeneficiary()
            ? 0
            : actualTransaction.fiatAmount - actualTransaction.profit;
          // Profit/Loss calculation
          actualTransaction.profitLossPercentage =
            actualTransaction.isTypeBeneficiary()
              ? 0
              : formatValueFromFloatToInt(
                  formatValueFromFloatToInt(actualTransaction.profit * 100, 2) /
                    actualTransaction.loss,
                  0,
                );
        }

        await this.cryptoReportRepository.update(actualTransaction);
      }
    }

    return transactions.splice(deleteLength);
  }
}
