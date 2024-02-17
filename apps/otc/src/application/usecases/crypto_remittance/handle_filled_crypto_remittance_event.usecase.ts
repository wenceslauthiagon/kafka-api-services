import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  MissingDataException,
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
} from '@zro/common';
import {
  RemittanceOrderRepository,
  SystemRepository,
  CryptoRemittanceRepository,
  CryptoRemittanceStatus,
  RemittanceOrderEntity,
  RemittanceOrderStatus,
  OrderSide,
  RemittanceOrderSide,
  System,
  SettlementDateCode,
} from '@zro/otc/domain';
import {
  CryptoRemittanceNotFoundException,
  CryptoRemittanceInvalidStatusException,
  SystemNotFoundException,
  RemittanceOrderEventEmitter,
} from '@zro/otc/application';

export class HandleFilledCryptoRemittanceEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param cryptoRemittanceRepository CryptoRemittance repository.
   * @param remittanceOrderRepository RemittanceOrder repository.
   * @param systemRepository System repository.
   * @param remittanceOrderEmitter RemittanceOrder emitter.
   * @param defaultSendDateCode Default send date code.
   * @param defaultReceiveDateCode Default receive date code.
   */
  constructor(
    private logger: Logger,
    private readonly cryptoRemittanceRepository: CryptoRemittanceRepository,
    private readonly remittanceOrderRepository: RemittanceOrderRepository,
    private readonly systemRepository: SystemRepository,
    private readonly remittanceOrderEmitter: RemittanceOrderEventEmitter,
    private readonly defaultSendDateCode: SettlementDateCode,
    private readonly defaultReceiveDateCode: SettlementDateCode,
  ) {
    this.logger = logger.child({
      context: HandleFilledCryptoRemittanceEventUseCase.name,
    });
  }

  /**
   * Handler triggered when crypto remittance was filled successfully.
   *
   * @param id Crypto remittance ID.
   * @param system System.
   */
  async execute(id: string, system: System): Promise<void> {
    // Data input check
    if (!id || !system?.name) {
      throw new MissingDataException([
        ...(!id ? ['Crypto Remittance ID'] : []),
        ...(!system?.name ? ['System Name'] : []),
      ]);
    }

    // Check if crypto remittance exists
    const cryptoRemittance = await this.cryptoRemittanceRepository.getById(id);

    this.logger.debug('Found crypto remittance.', {
      cryptoRemittance,
    });

    if (!cryptoRemittance) {
      throw new CryptoRemittanceNotFoundException({ id });
    }

    // Idempotency check
    if (cryptoRemittance.status !== CryptoRemittanceStatus.FILLED) {
      throw new CryptoRemittanceInvalidStatusException(cryptoRemittance);
    }

    const systemFound = await this.systemRepository.getByName(system.name);

    this.logger.debug('Found system.', {
      systemFound,
    });

    if (!systemFound) {
      throw new SystemNotFoundException(system);
    }

    const executedCryptoAmountFormatted = formatValueFromIntToFloat(
      cryptoRemittance.executedAmount,
      cryptoRemittance.baseCurrency.decimal,
    );

    const executedFiatPriceFormatted = formatValueFromIntToFloat(
      cryptoRemittance.executedPrice,
      cryptoRemittance.market.priceSignificantDigits,
    );

    // Format to USD.
    const amount = formatValueFromFloatToInt(
      executedCryptoAmountFormatted * executedFiatPriceFormatted,
      cryptoRemittance.quoteCurrency.decimal,
    );

    // Create new remittance order
    const remittanceOrder = new RemittanceOrderEntity({
      id: uuidV4(),
      side:
        cryptoRemittance.side === OrderSide.BUY
          ? RemittanceOrderSide.BUY
          : RemittanceOrderSide.SELL,
      currency: cryptoRemittance.quoteCurrency,
      amount,
      status: RemittanceOrderStatus.OPEN,
      system: systemFound,
      provider: cryptoRemittance.provider,
      cryptoRemittance: cryptoRemittance,
      sendDateCode: this.defaultSendDateCode,
      receiveDateCode: this.defaultReceiveDateCode,
    });

    // Create Remittance Order
    const newRemittanceOrder =
      await this.remittanceOrderRepository.create(remittanceOrder);

    this.logger.debug('Created new remittance order.', {
      newRemittanceOrder,
    });

    this.remittanceOrderEmitter.createdRemittanceOrder(newRemittanceOrder);
  }
}
