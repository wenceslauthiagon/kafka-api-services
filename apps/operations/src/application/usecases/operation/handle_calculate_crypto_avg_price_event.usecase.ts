import { Logger } from 'winston';
import {
  MissingDataException,
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
} from '@zro/common';
import {
  Currency,
  Operation,
  CurrencyType,
  WalletAccountRepository,
  OperationRepository,
  CurrencyRepository,
} from '@zro/operations/domain';
import {
  OtcService,
  CurrencyNotFoundException,
  OperationNotFoundException,
  CurrencyInvalidTypeException,
  WalletAccountNotFoundException,
  TransactionTypeInvalidTagException,
} from '@zro/operations/application';
import { ConversionNotFoundException } from '@zro/otc/application';

const CONVERSION_TRANSACTION_TAG = 'CONV';
const CASHBACK_TRANSACTION_TAG = 'CASHBACK';
const P2PBT_TRANSACTION_TAG = 'P2PBT';
const REFERRAL_REWARD_TRANSACTION_TAG = 'REFREWARD';
const P2P_TRANSFER_TRANSACTION_TAG = 'P2PBTCTP';

export class HandleCalculateCryptoAvgPriceEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param walletAccountRepository User wallet repository.
   * @param operationRepository Operation repository.
   * @param currencyRepository Currency repository.
   * @param otcService OTC service.
   * @param cryptoTransactionTags Crypto transaction tags.
   */
  constructor(
    private logger: Logger,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly operationRepository: OperationRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly otcService: OtcService,
    private readonly cryptoTransactionTags: string,
  ) {
    this.logger = logger.child({
      context: HandleCalculateCryptoAvgPriceEventUseCase.name,
    });
  }

  /**
   * Handler triggered when operation event is accepted.
   * This calculate the crypto average price by new operation.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(beneficiaryOperation: Operation): Promise<void> {
    // Data input check
    if (
      !beneficiaryOperation?.id ||
      !beneficiaryOperation?.beneficiaryWalletAccount?.id ||
      !beneficiaryOperation?.transactionType?.tag ||
      !beneficiaryOperation?.currency?.id
    ) {
      throw new MissingDataException([
        ...(!beneficiaryOperation?.id ? ['Operation'] : []),
        ...(!beneficiaryOperation?.beneficiaryWalletAccount?.id
          ? ['Wallet Account']
          : []),
        ...(!beneficiaryOperation?.transactionType?.tag
          ? ['Transaction Type Tag']
          : []),
        ...(!beneficiaryOperation?.currency?.id ? ['Currency'] : []),
      ]);
    }

    const transactionType = beneficiaryOperation.transactionType;

    if (!this.cryptoTransactionTags.includes(transactionType.tag)) {
      return;
    }

    const walletAccount = await this.walletAccountRepository.getById(
      beneficiaryOperation.beneficiaryWalletAccount.id,
    );

    this.logger.debug('Wallet account found.', {
      walletAccount,
    });

    if (!walletAccount) {
      throw new WalletAccountNotFoundException(
        beneficiaryOperation.beneficiaryWalletAccount,
      );
    }

    const currency = await this.currencyRepository.getById(
      beneficiaryOperation.currency.id,
    );

    this.logger.debug('Currency found.', {
      currency,
    });

    if (!currency) {
      throw new CurrencyNotFoundException(beneficiaryOperation.currency);
    }

    if (currency.type !== CurrencyType.CRYPTO) {
      throw new CurrencyInvalidTypeException(currency);
    }

    let price: number;

    switch (transactionType.tag) {
      case CONVERSION_TRANSACTION_TAG:
        price = await this.handleConversion(beneficiaryOperation, currency);
        break;
      case CASHBACK_TRANSACTION_TAG || REFERRAL_REWARD_TRANSACTION_TAG:
        price = await this.handleCashback(beneficiaryOperation);
        break;
      case P2PBT_TRANSACTION_TAG || P2P_TRANSFER_TRANSACTION_TAG:
        price = await this.handleP2PTransfer(beneficiaryOperation, currency);
        break;
      default:
        throw new TransactionTypeInvalidTagException(transactionType);
    }

    // Avarage price calculation
    const lastAvgPrice = walletAccount.averagePrice;
    const lastBalance = walletAccount.balance - beneficiaryOperation.value;
    const currentBalance = walletAccount.balance;

    walletAccount.averagePrice = lastAvgPrice
      ? formatValueFromFloatToInt(
          (lastAvgPrice * lastBalance + beneficiaryOperation.value * price) /
            currentBalance,
          0,
        )
      : price;

    await this.walletAccountRepository.update(walletAccount);

    this.logger.debug('Updated wallet account.', {
      walletAccount,
    });
  }

  async handleConversion(
    operation: Operation,
    currency: Currency,
  ): Promise<number> {
    if (!operation.operationRef?.id) {
      throw new MissingDataException(['Operation Ref']);
    }

    const operationRef = await this.operationRepository.getById(
      operation.operationRef.id,
    );

    this.logger.debug('Operation Ref found.', {
      operationRef,
    });

    if (!operationRef) {
      throw new OperationNotFoundException(operation.operationRef.id);
    }

    const price = formatValueFromFloatToInt(
      operationRef.value /
        formatValueFromIntToFloat(operation.value, currency.decimal),
      0,
    );

    return price;
  }

  async handleCashback(operation: Operation): Promise<number> {
    const conversion =
      await this.otcService.getConversionByOperation(operation);

    this.logger.debug('Conversion found.', {
      conversion,
    });

    if (!conversion) {
      throw new ConversionNotFoundException({ operation });
    }

    const price = formatValueFromFloatToInt(
      conversion.usdQuote * Number(conversion.quote),
      0,
    );

    return price;
  }

  async handleP2PTransfer(
    operation: Operation,
    currency: Currency,
  ): Promise<number> {
    const operationWithMoreInfo = await this.operationRepository.getById(
      operation.id,
    );

    this.logger.debug('Operation Complete found.', {
      operationWithMoreInfo,
    });

    if (!operationWithMoreInfo) {
      throw new OperationNotFoundException(operation.id);
    }

    const price = await this.otcService.getCryptoPriceByCurrencyAndDate(
      currency,
      operationWithMoreInfo.createdAt,
    );

    return price;
  }
}
