import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { isNumber } from 'class-validator';
import {
  MissingDataException,
  ForbiddenException,
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
} from '@zro/common';
import {
  Conversion,
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
  UserService,
  ConversionEventEmitter,
  CryptoOrderEventEmitter,
  OperationService,
  QuotationService,
} from '@zro/otc/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  WalletAccountNotFoundException,
  CurrencyNotFoundException,
  WalletAccountNotActiveException,
} from '@zro/operations/application';
import { QuotationNotFoundException } from '@zro/quotations/application';

export class CreateConversionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param conversionRepository Conversion repository.
   * @param cryptoOrderRepository Cryptoorder repository.
   * @param conversionEmitter Conversion emitter.
   * @param cryptoOrderEmitter Cryptoorder emitter.
   * @param userService User Service
   * @param operationService Operation service
   * @param quotationService Quotation service
   * @param conversionOperationTransactionTag Tag for create operation
   * @param conversionDepositOperationDescription Tag description when create operation beneficiary
   * @param conversionWithdrawalOperationDescription Tag description when create operation owner
   * @param symbolCurrencyMidQuote Mid(intermediate) quote
   */
  constructor(
    private logger: Logger,
    private readonly conversionRepository: ConversionRepository,
    private readonly cryptoOrderRepository: CryptoOrderRepository,
    private readonly systemRepository: SystemRepository,
    private readonly conversionEmitter: ConversionEventEmitter,
    private readonly cryptoOrderEmitter: CryptoOrderEventEmitter,
    private readonly userService: UserService,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
    private readonly conversionOperationTransactionTag: string,
    private readonly conversionDepositOperationDescription: string,
    private readonly conversionWithdrawalOperationDescription: string,
    private readonly conversionSystemName: string,
    private readonly symbolCurrencyMidQuote: string,
  ) {
    this.logger = logger.child({ context: CreateConversionUseCase.name });
  }

  async execute(
    id: string,
    user: User,
    wallet: Wallet,
    quotation: Quotation,
    systemName: string,
  ): Promise<Conversion> {
    // Data input check
    if (!id || !user?.uuid || !wallet?.uuid || !quotation?.id) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!quotation?.id ? ['Quotation'] : []),
      ]);
    }

    // Check if Conversion's id is available
    const checkConversion = await this.conversionRepository.getById(id);

    this.logger.debug('Check if conversion id exists.', {
      conversion: checkConversion,
    });

    if (checkConversion) {
      if (checkConversion.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }
      return checkConversion;
    }

    // Get quotation
    const quotationFound =
      await this.quotationService.getCurrentQuotationById(quotation);

    this.logger.debug('Quotation found.', { quotation: quotationFound });

    if (!quotationFound) {
      throw new QuotationNotFoundException(quotation);
    }

    // Data input sanitize
    if (
      !quotationFound.baseCurrency?.symbol ||
      !quotationFound.quoteCurrency?.symbol ||
      !quotationFound.baseAmountBuy ||
      !quotationFound.baseAmountSell ||
      !quotationFound.quoteAmountBuy ||
      !quotationFound.quoteAmountSell ||
      !quotationFound.partialBuy ||
      !quotationFound.partialSell ||
      !quotationFound.spreads?.length ||
      !isNumber(quotationFound.spreadBuy) ||
      !isNumber(quotationFound.spreadSell) ||
      !isNumber(quotationFound.spreadAmountBuy) ||
      !isNumber(quotationFound.spreadAmountSell) ||
      !quotationFound.iofAmount ||
      !quotationFound.side
    ) {
      throw new MissingDataException([
        ...(!quotationFound.baseCurrency?.symbol
          ? ['Base Currency Symbol']
          : []),
        ...(!quotationFound.quoteCurrency?.symbol
          ? ['Quote Currency Symbol']
          : []),
        ...(!quotationFound.baseAmountBuy ? ['Base Amount Buy'] : []),
        ...(!quotationFound.baseAmountSell ? ['Base Amount Sell'] : []),
        ...(!quotationFound.quoteAmountBuy ? ['Base Amount Buy'] : []),
        ...(!quotationFound.quoteAmountSell ? ['Base Amount Sell'] : []),
        ...(!quotationFound.partialBuy ? ['Partial Buy'] : []),
        ...(!quotationFound.partialSell ? ['Partial Sell'] : []),
        ...(!quotationFound.spreads?.length ? ['Spreads'] : []),
        ...(!isNumber(quotationFound.spreadBuy) ? ['Spread Buy'] : []),
        ...(!isNumber(quotationFound.spreadSell) ? ['Spread Sell'] : []),
        ...(!isNumber(quotationFound.spreadAmountBuy)
          ? ['Spread Amount Buy']
          : []),
        ...(!isNumber(quotationFound.spreadAmountSell)
          ? ['Spread Amount Sell']
          : []),
        ...(!quotationFound.iofAmount ? ['IOF Amount'] : []),
        ...(!quotationFound.side ? ['Side'] : []),
      ]);
    }

    // Search and validate user
    const userFound = await this.userService.getUserByUuid(user);

    this.logger.debug('Found user.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException(user);
    }

    if (!userFound.document || !userFound.fullName || !userFound.type) {
      throw new MissingDataException([
        ...(!userFound.document ? ['Document'] : []),
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

    // Check Currencies exists
    const foundBaseCurrency = await this.operationService.getCurrencyBySymbol(
      quotationFound.baseCurrency.symbol,
    );

    this.logger.debug('Base currency conversion found', { foundBaseCurrency });

    if (!foundBaseCurrency) {
      throw new CurrencyNotFoundException(quotationFound.baseCurrency);
    }

    const foundQuoteCurrency = await this.operationService.getCurrencyBySymbol(
      quotationFound.quoteCurrency.symbol,
    );

    this.logger.debug('Quote currency conversion found.', {
      foundQuoteCurrency,
    });

    if (!foundQuoteCurrency) {
      throw new CurrencyNotFoundException(quotationFound.quoteCurrency);
    }

    // Check wallet's accounts from User
    const walletAccountByCurrencyBase =
      await this.operationService.getWalletAccountByWalletAndCurrency(
        wallet,
        foundBaseCurrency,
      );

    this.logger.debug('Wallet account by currency base found.', {
      walletAccount: walletAccountByCurrencyBase,
    });

    if (!walletAccountByCurrencyBase) {
      throw new WalletAccountNotFoundException({
        currency: foundBaseCurrency,
        wallet,
      });
    }
    if (!walletAccountByCurrencyBase.isActive()) {
      throw new WalletAccountNotActiveException(walletAccountByCurrencyBase);
    }

    const walletAccountByCurrencyQuote =
      await this.operationService.getWalletAccountByWalletAndCurrency(
        wallet,
        foundQuoteCurrency,
      );

    this.logger.debug('Wallet account by currency quote found.', {
      walletAccount: walletAccountByCurrencyQuote,
    });

    if (!walletAccountByCurrencyQuote) {
      throw new WalletAccountNotFoundException({
        currency: foundQuoteCurrency,
        wallet,
      });
    }
    if (!walletAccountByCurrencyQuote.isActive()) {
      throw new WalletAccountNotActiveException(walletAccountByCurrencyQuote);
    }

    // Check infos for buy or sell
    let conversionOperation: Operation;
    let cryptoAmount: number;
    let cryptoQuote: string;
    let usdQuote: number;
    let usdAmount: number;
    let fiatAmount: number;

    if (quotationFound.side === OrderSide.BUY) {
      conversionOperation = await this.createOperationWhenBuy(
        quotationFound,
        foundQuoteCurrency,
        foundBaseCurrency,
        wallet,
      );

      const { cryptoQuoteFound, usdQuoteFound } = this.searchQuotePairValues(
        quotationFound,
        OrderSide.BUY,
      );

      cryptoAmount = quotationFound.baseAmountBuy;
      cryptoQuote = cryptoQuoteFound;
      usdQuote = formatValueFromFloatToInt(usdQuoteFound);
      fiatAmount = quotationFound.partialBuy;

      // Calculate UsdAmount
      const fiatAmountFloat = formatValueFromIntToFloat(
        quotationFound.partialBuy,
        foundQuoteCurrency.decimal,
      );

      usdAmount = formatValueFromFloatToInt(fiatAmountFloat / usdQuoteFound);
    } else {
      // Create and accept operation for SELL SIDE
      conversionOperation = await this.createOperationWhenSell(
        quotationFound,
        foundQuoteCurrency,
        foundBaseCurrency,
        wallet,
      );

      const { cryptoQuoteFound, usdQuoteFound } = this.searchQuotePairValues(
        quotationFound,
        OrderSide.SELL,
      );

      cryptoAmount = quotationFound.baseAmountSell;
      cryptoQuote = cryptoQuoteFound;
      usdQuote = formatValueFromFloatToInt(usdQuoteFound);
      fiatAmount = quotationFound.partialSell;

      // Calculate UsdAmount
      const fiatAmountFloat = formatValueFromIntToFloat(
        quotationFound.partialSell,
        foundQuoteCurrency.decimal,
      );
      usdAmount = formatValueFromFloatToInt(fiatAmountFloat / usdQuoteFound);
    }

    // create conversion
    const newConversion = new ConversionEntity({
      id,
      operation: conversionOperation,
      user,
      currency: foundBaseCurrency,
      conversionType: quotationFound.side,
      clientName: user.fullName,
      clientDocument: user.document,
      amount: cryptoAmount,
      usdAmount,
      quote: cryptoQuote,
      usdQuote,
      fiatAmount,
      quotation: quotationFound,
    });

    await this.conversionRepository.create(newConversion);
    this.conversionEmitter.readyConversion(newConversion);

    this.logger.info('Added new conversion.', { newConversion });

    // Save quotation
    await this.quotationService.createQuotation(quotationFound);

    const systemNameConversion = systemName ?? this.conversionSystemName;

    const system = await this.systemRepository.getByName(systemNameConversion);

    // create cryptoOrder
    const newCryptoOrder = new CryptoOrderEntity({
      id: uuidV4(),
      baseCurrency: foundBaseCurrency,
      amount: cryptoAmount,
      side: quotationFound.side,
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

    this.logger.info('Added new crypto order.', { newCryptoOrder });

    return newConversion;
  }

  private async createOperationWhenBuy(
    quotation: Quotation,
    foundQuoteCurrency: Currency,
    foundBaseCurrency: Currency,
    wallet: Wallet,
  ): Promise<Operation> {
    // Create and accept operation for BUY SIDE
    const operationOwner = new OperationEntity({
      id: uuidV4(),
      rawValue: quotation.partialBuy,
      fee: quotation.spreadAmountBuy + quotation.iofAmount,
      currency: foundQuoteCurrency,
      description: this.conversionWithdrawalOperationDescription,
    });

    const operationBeneficiary = new OperationEntity({
      id: uuidV4(),
      rawValue: quotation.baseAmountBuy,
      currency: foundBaseCurrency,
      description: this.conversionDepositOperationDescription,
    });

    await this.operationService.createAndAcceptOperation(
      this.conversionOperationTransactionTag,
      operationOwner,
      operationBeneficiary,
      wallet,
      wallet,
    );

    this.logger.info('Created and accepted conversion when buy.', {
      operationOwner,
      operationBeneficiary,
    });

    return operationBeneficiary;
  }

  private async createOperationWhenSell(
    quotation: Quotation,
    foundQuoteCurrency: Currency,
    foundBaseCurrency: Currency,
    wallet: Wallet,
  ): Promise<Operation> {
    const operationOwner = new OperationEntity({
      id: uuidV4(),
      rawValue: quotation.baseAmountSell,
      currency: foundBaseCurrency,
      description: this.conversionWithdrawalOperationDescription,
    });

    const operationBeneficiary = new OperationEntity({
      id: uuidV4(),
      rawValue: quotation.partialSell,
      fee: quotation.spreadAmountSell + quotation.iofAmount,
      currency: foundQuoteCurrency,
      description: this.conversionDepositOperationDescription,
    });

    await this.operationService.createAndAcceptOperation(
      this.conversionOperationTransactionTag,
      operationOwner,
      operationBeneficiary,
      wallet,
      wallet,
    );

    this.logger.info('Created and accepted conversion when sell.', {
      operationOwner,
      operationBeneficiary,
    });

    return operationOwner;
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
