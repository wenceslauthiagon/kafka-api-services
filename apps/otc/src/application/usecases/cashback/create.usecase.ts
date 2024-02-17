import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { isNumber } from 'class-validator';
import {
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
  MissingDataException,
  ForbiddenException,
} from '@zro/common';
import {
  Cashback,
  CashbackEntity,
  CashbackRepository,
  ConversionEntity,
  ConversionRepository,
  CryptoOrderEntity,
  CryptoOrderRepository,
  CryptoOrderState,
  OrderSide,
  OrderType,
  SystemRepository,
} from '@zro/otc/domain';
import { Quotation } from '@zro/quotations/domain';
import { PersonDocumentType, PersonType, User } from '@zro/users/domain';
import {
  Currency,
  Operation,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import {
  CurrencyNotActiveException,
  CurrencyNotFoundException,
  WalletAccountNotActiveException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';
import { QuotationNotFoundException } from '@zro/quotations/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  CryptoOrderEventEmitter,
  ConversionEventEmitter,
  CashbackEventEmitter,
  OperationService,
  QuotationService,
  UserService,
} from '@zro/otc/application';

export class CreateCashbackUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param conversionRepository Conversion repository.
   * @param cryptoOrderRepository Cryptoorder repository.
   * @param systemRepository System repository.
   * @param cashbackRepository Cashback repository.
   * @param cryptoOrderEmitter Cryptoorder emitter.
   * @param conversionEmitter Conversion emitter.
   * @param cashbackEmitter Cashback emitter.
   * @param operationService Operation service.
   * @param quotationService Quotation service.
   * @param cashbackOperationTransactionTag Cashback transaction tag.
   * @param conversionSystemName Conversion system name.
   * @param symbolCurrencyMidQuote Mid(intermediare) quote
   */
  constructor(
    private logger: Logger,
    private readonly conversionRepository: ConversionRepository,
    private readonly cryptoOrderRepository: CryptoOrderRepository,
    private readonly systemRepository: SystemRepository,
    private readonly cashbackRepository: CashbackRepository,
    private readonly cryptoOrderEmitter: CryptoOrderEventEmitter,
    private readonly conversionEmitter: ConversionEventEmitter,
    private readonly cashbackEmitter: CashbackEventEmitter,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
    private readonly userService: UserService,
    private readonly cashbackOperationTransactionTag: string,
    private readonly conversionSystemName: string,
    private readonly symbolCurrencyMidQuote: string,
  ) {
    this.logger = logger.child({ context: CreateCashbackUseCase.name });
  }

  async execute(
    id: string,
    user: User,
    wallet: Wallet,
    baseCurrency: Currency,
    amountCurrency: Currency,
    amount: number,
    description?: string,
    issuedBy?: string,
  ): Promise<Cashback> {
    // Data input check
    if (
      !id ||
      !user?.uuid ||
      !wallet?.uuid ||
      !baseCurrency?.symbol ||
      !amountCurrency?.symbol ||
      !isNumber(amount)
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!baseCurrency?.symbol ? ['Base Currency'] : []),
        ...(!amountCurrency?.symbol ? ['Amount Currency'] : []),
        ...(!isNumber(amount) ? ['Amount'] : []),
      ]);
    }

    // Check if Cashback's id is available
    const checkCashback =
      await this.cashbackRepository.getWithConversionById(id);

    this.logger.debug('Check if cashback id exists.', {
      cashback: checkCashback,
    });

    if (checkCashback) {
      if (checkCashback.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }
      return checkCashback;
    }

    // Search and validate user
    const userFound = await this.userService.getUserByUuid(user);

    this.logger.debug('Found user.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException(user);
    }

    if (!userFound.document || !userFound.fullName || !userFound.type) {
      throw new MissingDataException([
        ...(!userFound.document ? ['document'] : []),
        ...(!userFound.fullName ? ['FullName'] : []),
        ...(!userFound.type ? ['Type'] : []),
      ]);
    }

    Object.assign(user, userFound);

    // Get finished onboarding
    const onboarding =
      await this.userService.getOnboardingByUserAndStatusIsFinished(user);

    this.logger.debug('Found onboarding.', { onboarding });

    if (!onboarding) {
      throw new OnboardingNotFoundException({ user });
    }

    // Check currency exists
    const baseCurrencyFound = await this.operationService.getCurrencyBySymbol(
      baseCurrency.symbol,
    );

    this.logger.debug('Base currency found.', { baseCurrencyFound });

    if (!baseCurrencyFound) {
      throw new CurrencyNotFoundException(baseCurrency);
    }
    if (!baseCurrencyFound.isActive()) {
      throw new CurrencyNotActiveException(baseCurrency);
    }

    const amountCurrencyFound = await this.operationService.getCurrencyBySymbol(
      amountCurrency.symbol,
    );

    this.logger.debug('Amount currency found.', { amountCurrencyFound });

    if (!amountCurrencyFound) {
      throw new CurrencyNotFoundException(amountCurrency);
    }
    if (!amountCurrencyFound.isActive()) {
      throw new CurrencyNotActiveException(amountCurrency);
    }

    // FIXME: Isso só deveria ser realizado caso a moeda do cashback seja uma cripto e diferente da moeda que originou o cashback.
    // Get Quotation
    const quotation = await this.quotationService.getQuotation(
      user,
      baseCurrency,
      amountCurrency,
      amount,
      OrderSide.BUY,
    );

    this.logger.debug('Found quotation.', { quotation });

    if (!quotation) {
      throw new QuotationNotFoundException({
        quoteCurrency: amountCurrency,
        baseCurrency,
      });
    }

    // Data input sanitize
    if (
      !quotation.provider?.name ||
      !quotation.baseCurrency?.symbol ||
      !quotation.quoteCurrency?.symbol ||
      !quotation.baseAmountBuy ||
      !quotation.baseAmountSell ||
      !quotation.quoteAmountBuy ||
      !quotation.quoteAmountSell ||
      !quotation.partialBuy ||
      !quotation.partialSell ||
      !quotation.spreads?.length ||
      !isNumber(quotation.spreadBuy) ||
      !isNumber(quotation.spreadSell) ||
      !isNumber(quotation.spreadAmountBuy) ||
      !isNumber(quotation.spreadAmountSell) ||
      !quotation.side
    ) {
      throw new MissingDataException([
        ...(!quotation.provider?.name ? ['Provider'] : []),
        ...(!quotation.baseCurrency?.symbol ? ['Base Currency'] : []),
        ...(!quotation.quoteCurrency?.symbol ? ['Quote Currency'] : []),
        ...(!quotation.baseAmountBuy ? ['Base Amount Buy'] : []),
        ...(!quotation.baseAmountSell ? ['Base Amount Sell'] : []),
        ...(!quotation.quoteAmountBuy ? ['Base Amount Buy'] : []),
        ...(!quotation.quoteAmountSell ? ['Base Amount Sell'] : []),
        ...(!quotation.partialBuy ? ['Partial Buy'] : []),
        ...(!quotation.partialSell ? ['Partial Sell'] : []),
        ...(!quotation.spreads?.length ? ['Spreads'] : []),
        ...(!isNumber(quotation.spreadBuy) ? ['Spread Buy'] : []),
        ...(!isNumber(quotation.spreadSell) ? ['Spread Sell'] : []),
        ...(!isNumber(quotation.spreadAmountBuy) ? ['Spread Amount Buy'] : []),
        ...(!isNumber(quotation.spreadAmountSell)
          ? ['Spread Amount Sell']
          : []),
        ...(!quotation.side ? ['Side'] : []),
      ]);
    }

    // Check wallet's accounts from User
    const walletAccountByCurrencyBase =
      await this.operationService.getWalletAccountByWalletAndCurrency(
        wallet,
        baseCurrencyFound,
      );

    this.logger.debug('Wallet account by currency base found.', {
      walletAccount: walletAccountByCurrencyBase,
    });

    if (!walletAccountByCurrencyBase) {
      throw new WalletAccountNotFoundException({
        currency: baseCurrencyFound,
        wallet,
      });
    }
    if (!walletAccountByCurrencyBase.isActive()) {
      throw new WalletAccountNotActiveException(walletAccountByCurrencyBase);
    }

    const conversionOperation = await this.createOperation(
      wallet,
      quotation,
      baseCurrencyFound,
      description ?? this.cashbackOperationTransactionTag,
    );

    const { cryptoQuoteFound, usdQuoteFound } = this.searchQuotePairValues(
      quotation,
      OrderSide.BUY,
    );

    const cryptoAmount = quotation.baseAmountBuy;
    const cryptoQuote = cryptoQuoteFound;
    const usdQuote = formatValueFromFloatToInt(usdQuoteFound);
    const fiatAmount = quotation.partialBuy;

    // Calculate UsdAmount
    const fiatAmountFloat = formatValueFromIntToFloat(
      quotation.partialBuy,
      quotation.quoteCurrency.decimal,
    );

    const usdAmount = formatValueFromFloatToInt(
      fiatAmountFloat / usdQuoteFound,
    );

    // create conversion
    const newConversion = new ConversionEntity({
      id: uuidV4(),
      operation: conversionOperation,
      user,
      currency: baseCurrencyFound,
      conversionType: quotation.side,
      clientName: user.fullName,
      clientDocument: user.document,
      amount: cryptoAmount,
      usdAmount,
      quote: cryptoQuote,
      usdQuote,
      fiatAmount,
      quotation,
    });

    await this.conversionRepository.create(newConversion);
    this.conversionEmitter.readyConversion(newConversion);

    this.logger.debug('Added new conversion.', { newConversion });

    const system = await this.systemRepository.getByName(
      this.conversionSystemName,
    );

    // create cryptoOrder
    const newCryptoOrder = new CryptoOrderEntity({
      id: uuidV4(),
      baseCurrency: baseCurrencyFound,
      amount: cryptoAmount,
      side: quotation.side,
      type: OrderType.MARKET,
      state: CryptoOrderState.PENDING,
      system,
      user,
      conversion: newConversion,
      clientName: user.fullName,
      clientDocument: user.document,
      clientDocumentType:
        user.type === PersonType.NATURAL_PERSON
          ? PersonDocumentType.CPF
          : PersonDocumentType.CNPJ,
    });

    await this.cryptoOrderRepository.create(newCryptoOrder);
    this.cryptoOrderEmitter.pendingCryptoOrder(newCryptoOrder);

    this.logger.debug('Added new crypto order.', { newCryptoOrder });

    // Save quotation
    await this.quotationService.createQuotation(quotation);

    const newCashback = new CashbackEntity({
      id,
      user,
      conversion: newConversion,
      amount,
      currency: baseCurrencyFound,
      description,
      issuedBy,
    });

    await this.cashbackRepository.create(newCashback);
    this.cashbackEmitter.readyCashback(newCashback);

    this.logger.info('Added new cashback.', { newCashback });

    return newCashback;
  }

  private async createOperation(
    beneficiaryWallet: Wallet,
    quotation: Quotation,
    currency: Currency,
    description: string,
  ): Promise<Operation> {
    const operationBeneficiary = new OperationEntity({
      id: uuidV4(),
      rawValue: quotation.baseAmountBuy,
      currency,
      description,
    });

    await this.operationService.createAndAcceptOperation(
      this.cashbackOperationTransactionTag,
      null,
      operationBeneficiary,
      null,
      beneficiaryWallet,
    );

    this.logger.debug('Created and accepted conversion.', {
      operationBeneficiary,
    });

    return operationBeneficiary;
  }

  private searchQuotePairValues(quotation: Quotation, side: OrderSide) {
    let cryptoQuoteFound: string, usdQuoteFound: number;
    for (const composedBy of quotation.streamQuotation?.composedBy) {
      if (composedBy.quoteCurrency.symbol === this.symbolCurrencyMidQuote) {
        cryptoQuoteFound = String(composedBy[side]);
      }

      if (composedBy.baseCurrency.symbol === this.symbolCurrencyMidQuote) {
        usdQuoteFound = composedBy[side];
      }
    }

    return { cryptoQuoteFound, usdQuoteFound };
  }
}
