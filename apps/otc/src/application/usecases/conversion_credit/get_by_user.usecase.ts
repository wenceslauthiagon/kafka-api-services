import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  OrderSide,
  ConversionCredit,
  ConversionCreditEntity,
} from '@zro/otc/domain';
import { User } from '@zro/users/domain';
import { QuotationNotFoundException } from '@zro/quotations/application';
import {
  OperationService,
  QuotationService,
  WalletsNotFoundException,
} from '@zro/otc/application';

export class GetConversionCreditByUserUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationService Operation service
   * @param quotationService Quotation service
   * @param conversionTransactionTag Conversion transaction tag
   * @param conversionSymbolCurrencyReal Currency BRL
   */
  constructor(
    private logger: Logger,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
    private readonly conversionTransactionTag: string,
    private readonly conversionSymbolCurrencyReal: string,
  ) {
    this.logger = logger.child({
      context: GetConversionCreditByUserUseCase.name,
    });
  }

  async execute(user: User): Promise<ConversionCredit> {
    // Data input check
    if (!user?.uuid) {
      throw new MissingDataException(['User']);
    }

    let liability = 0;
    let creditBalance = 0;

    // Check if user has credit balance
    const limitTypes = await this.operationService.getLimitTypesByFilter(
      this.conversionTransactionTag,
    );

    this.logger.debug('Found limitTypes.', { limitTypes });

    if (limitTypes.length) {
      const checkUserLimit = await this.operationService.getUserLimitsByFilter(
        limitTypes[0],
        user,
      );

      // Get credit balance
      if (checkUserLimit.length) {
        const userLimitFound = checkUserLimit.find(
          (userLimit) => userLimit.creditBalance,
        );

        creditBalance = userLimitFound?.creditBalance || 0;
      }
    }

    const currencies = await this.operationService.getAllActiveCurrencies();

    const wallets = await this.operationService.getWalletsByUser(user);

    if (!wallets.length) {
      throw new WalletsNotFoundException(user);
    }

    // Get for each currency Wallet account and quotation for calculate liability (all balances negative)
    for (const currency of currencies) {
      for (const wallet of wallets) {
        const walletAccount =
          await this.operationService.getWalletAccountByWalletAndCurrency(
            wallet,
            currency,
          );

        this.logger.debug('WalletAccount found.', { walletAccount });

        // If it is a inactive wallet account, keep going.
        if (!walletAccount?.isActive()) {
          continue;
        }

        if (walletAccount.balance < 0) {
          // Calculate using balance BRL, not need to get quotation
          if (currency.symbol === this.conversionSymbolCurrencyReal) {
            liability += Math.abs(walletAccount.balance);
            continue;
          }

          const quotationFound = await this.quotationService.getQuotation(
            user,
            currency,
            currency,
            Math.abs(walletAccount.balance),
            OrderSide.BUY,
          );

          if (!quotationFound) {
            throw new QuotationNotFoundException({ baseCurrency: currency });
          }

          // quoteAmount is the value in BRL for walletAccountBalance used to calculate liability
          liability += quotationFound.quoteAmountBuy;

          this.logger.debug('Reference values for calculate liability.', {
            liability,
            currency,
            quoteAmountBuy: quotationFound.quoteAmountBuy,
          });
        }
      }
    }

    const conversionCredit = new ConversionCreditEntity({
      liability,
      creditBalance,
      user,
    });

    return conversionCredit;
  }
}
