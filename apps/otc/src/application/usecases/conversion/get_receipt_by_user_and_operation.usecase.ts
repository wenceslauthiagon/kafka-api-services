import { Logger } from 'winston';
import {
  formatDateAndTime,
  formatToValueReal,
  MissingDataException,
  ReceiptPortugueseTranslation,
  dateTimeFormat,
  formatValueFromIntToFloat,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency, Operation } from '@zro/operations/domain';
import {
  Conversion,
  ConversionReceiptEntity,
  ConversionRepository,
  OrderSide,
} from '@zro/otc/domain';
import { CurrenciesDontMatchException } from '@zro/otc/application';

export class GetConversionReceiptByUserAndOperationUseCase {
  constructor(
    private logger: Logger,
    private conversionRepository: ConversionRepository,
  ) {
    this.logger = logger.child({
      context: GetConversionReceiptByUserAndOperationUseCase.name,
    });
  }

  /**
   * Get conversion receipt by user and operation.
   *
   * @param user User.
   * @param operation Operation.
   * @returns The conversion receipt found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    user: User,
    operation: Operation,
    currency: Currency,
  ): Promise<ConversionReceiptEntity> {
    if (
      !user?.uuid ||
      !operation?.id ||
      !currency?.id ||
      !currency.symbol ||
      !currency.title
    ) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!operation?.id ? ['Operation'] : []),
        ...(!currency?.id ? ['Currency Id'] : []),
        ...(!currency?.symbol ? ['Currency Symbol'] : []),
        ...(!currency?.title ? ['Currency Title'] : []),
      ]);
    }

    const conversion = await this.conversionRepository.getByUserAndOperation(
      user,
      operation,
    );

    if (!conversion) {
      return null;
    }

    this.logger.debug('Conversion found.', { conversion });

    if (conversion.currency.id !== currency.id) {
      throw new CurrenciesDontMatchException([conversion.currency, currency]);
    }

    const receipt = conversion && this.generateReceipt(conversion, currency);

    return receipt;
  }

  generateReceipt(
    conversion: Conversion,
    currency: Currency,
  ): ConversionReceiptEntity {
    const isBuyConversion = conversion.conversionType === OrderSide.BUY;

    const cryptoSymbol = currency.symbol;

    const fiatAmount = formatValueFromIntToFloat(conversion.fiatAmount);
    const cryptoAmount = formatValueFromIntToFloat(
      conversion.amount,
      currency.decimal,
    );

    const quote = fiatAmount / cryptoAmount;

    const brlQuote = formatToValueReal(quote);

    const cryptoInformations = [
      { [ReceiptPortugueseTranslation.tag]: currency.title },
      {
        [ReceiptPortugueseTranslation.value]: `${cryptoSymbol}: ${cryptoAmount}`,
      },
    ];

    const fiatInformations = [
      { [ReceiptPortugueseTranslation.tag]: 'Real' },
      {
        [ReceiptPortugueseTranslation.value]: formatToValueReal(fiatAmount),
      },
    ];

    const paymentData = [
      {
        [ReceiptPortugueseTranslation.valueConverted]: [
          {
            [ReceiptPortugueseTranslation.value]: `${cryptoSymbol} ${cryptoAmount}`,
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              conversion.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.conversionOf]: isBuyConversion
          ? fiatInformations
          : cryptoInformations,
      },
      {
        [ReceiptPortugueseTranslation.conversionTo]: isBuyConversion
          ? cryptoInformations
          : fiatInformations,
      },
      {
        [`Cotação de ${currency.tag} no momento`]: [
          {
            [ReceiptPortugueseTranslation.value]: brlQuote,
          },
        ],
      },
    ];

    return new ConversionReceiptEntity({
      paymentData,
      operationId: conversion.operation.id,
    });
  }
}
