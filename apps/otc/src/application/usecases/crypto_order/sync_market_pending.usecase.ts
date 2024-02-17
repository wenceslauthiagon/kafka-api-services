import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import { StreamQuotation } from '@zro/quotations/domain';
import { Currency, CurrencyType } from '@zro/operations/domain';
import {
  CryptoRemittanceRepository,
  CryptoOrderRepository,
  CryptoRemittanceEntity,
  CryptoOrderState,
  OrderSide,
  CryptoRemittance,
  OrderType,
  CryptoOrderEntity,
  CryptoRemittanceStatus,
  ProviderRepository,
  ConversionRepository,
  System,
  CryptoOrder,
} from '@zro/otc/domain';
import {
  CryptoMarketNotFoundException,
  CryptoOrderEventEmitter,
  CryptoRemittanceEventEmitter,
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayNotFoundException,
  CryptoRemittanceNotPlacedException,
  ProviderNotFoundException,
  QuotationService,
} from '@zro/otc/application';

export class SyncMarketPendingCryptoOrdersUseCase {
  constructor(
    private readonly logger: Logger,
    private readonly cryptoRemittanceRepository: CryptoRemittanceRepository,
    private readonly cryptoOrderRepository: CryptoOrderRepository,
    private readonly providerRepository: ProviderRepository,
    private readonly conversionRepository: ConversionRepository,
    private readonly quotationService: QuotationService,
    private readonly cryptoRemittanceGateways: CryptoRemittanceGateway[],
    private readonly cryptoRemittanceEventEmitter: CryptoRemittanceEventEmitter,
    private readonly cryptoOrderEventEmitter: CryptoOrderEventEmitter,
    private readonly systems: System[],
  ) {
    this.logger = this.logger.child({
      context: SyncMarketPendingCryptoOrdersUseCase.name,
    });
  }

  async execute(baseCurrency: Currency): Promise<void> {
    // Sanity check.
    if (!baseCurrency) {
      throw new MissingDataException(['Base currency']);
    }

    // List all market pending orders to be filled ASAP.
    const orders =
      await this.cryptoOrderRepository.getAllWithConversionByBaseCurrencyAndStateAndType(
        baseCurrency,
        CryptoOrderState.PENDING,
        OrderType.MARKET,
      );

    this.logger.debug('Pending orders.', { orders });

    // If no pending order is found, then go around.
    if (!orders.length) return;

    for (const system of this.systems) {
      const ordersBySystem = orders.filter(
        (order) => order.system.id === system.id,
      );

      // If no order by system is found, go to next system orders.
      if (!ordersBySystem.length) continue;

      await this.executeBySystem(ordersBySystem, baseCurrency, system);
    }
  }

  private async executeBySystem(
    orders: CryptoOrder[],
    baseCurrency: Currency,
    system: System,
  ): Promise<void> {
    // Get remittance size.
    let amount = orders.reduce((acc, cur) => {
      acc += cur.side === OrderSide.BUY ? cur.amount : -cur.amount;
      return acc;
    }, 0);

    // If size is zero then no need to send it to a provider.
    if (!amount) {
      const reconciledId = uuidV4();
      const reconciledOrders = await Promise.all(
        orders.map((order) => {
          order.state = CryptoOrderState.RECONCILIED;
          order.reconciledId = reconciledId;

          return this.cryptoOrderRepository.update(order);
        }),
      );

      this.logger.debug('Reconciled orders.', { reconciledOrders });

      return;
    }

    // Negative size means a sell remittance.
    const side = amount < 0 ? OrderSide.SELL : OrderSide.BUY;

    // Get absolute size value to fill remittance.
    amount = Math.abs(amount);

    // Get best price for this remittance.
    // TODO: refactor this flow that gets the orderedQuotations
    const streamQuotationFound =
      await this.quotationService.getStreamQuotationByBaseCurrency(
        baseCurrency,
      );

    // If no stream quotation then go around.
    if (!streamQuotationFound) return;

    let streamQuotations = [streamQuotationFound];

    // Is a syntheic pair?
    if (streamQuotationFound.composedBy) {
      streamQuotations = streamQuotationFound.composedBy;
    }

    // Order stream quotations starting from base currency.
    const orderedQuotations = [];
    let nextBaseCurrency = baseCurrency;

    while (orderedQuotations.length < streamQuotations.length) {
      const stream = streamQuotations.find(
        (stream) => stream.baseCurrency.symbol === nextBaseCurrency.symbol,
      );
      if (!stream) break;
      nextBaseCurrency = stream.quoteCurrency;
      orderedQuotations.push(stream);
    }

    if (!orderedQuotations.length) {
      this.logger.debug('No orders to process.');
      return;
    }

    const [streamQuotation] = orderedQuotations;

    // For all stream quotations, try to execute at gateway.
    if (streamQuotation.baseCurrency.type === CurrencyType.FIAT) {
      this.logger.error('Not implemented yet.');
      return;
    }

    const cryptoRemittance = await this.processNaturalCryptoRemittance(
      amount,
      side,
      streamQuotation,
      system,
    );

    // If no cryptoRemittance is found return.
    if (!cryptoRemittance?.executedAmount) return;

    const remaining = amount - cryptoRemittance.executedAmount;

    // There were remaining amount?
    if (remaining) {
      // Create crypto order to execute remaining later.
      const remainingOrder = new CryptoOrderEntity({
        id: uuidV4(),
        baseCurrency: streamQuotation.baseCurrency,
        amount: Math.abs(remaining),
        side: side,
        type: OrderType.MARKET,
        state: CryptoOrderState.PENDING,
        remainingCryptoRemittance: cryptoRemittance,
        system,
      });

      this.logger.info('Created remaining crypto order.', { remainingOrder });

      await this.cryptoOrderRepository.create(remainingOrder);

      // Notify new crypto order created.
      this.cryptoOrderEventEmitter.pendingCryptoOrder(remainingOrder);
    }

    // Set all orders as confirmed.
    await Promise.all(
      orders.map(async (order) => {
        order.state = CryptoOrderState.CONFIRMED;
        order.cryptoRemittance = cryptoRemittance;
        order.provider = cryptoRemittance.provider;

        await this.cryptoOrderRepository.update(order);

        return this.cryptoOrderEventEmitter.confirmedCryptoOrder(order);
      }),
    );

    // Update all conversions
    await Promise.all(
      orders
        .filter((order) => order.conversion)
        .map((order) => {
          const conversion = order.conversion;
          conversion.provider = order.provider;
          return this.conversionRepository.update(conversion);
        }),
    );

    // Check next step on conversion process
    if (streamQuotation.quoteCurrency.type === CurrencyType.CRYPTO) {
      // Create next crypto order to execute later.
      const nextOrder = new CryptoOrderEntity({
        id: uuidV4(),
        baseCurrency: streamQuotation.quoteCurrency,
        amount: cryptoRemittance.executedAmount,
        side: side,
        type: OrderType.MARKET,
        state: CryptoOrderState.PENDING,
        previousCryptoRemittance: cryptoRemittance,
        system,
      });

      this.logger.info('Created next crypto order', { next: nextOrder });

      await this.cryptoOrderRepository.create(nextOrder);

      // Notify new crypto order created.
      this.cryptoOrderEventEmitter.pendingCryptoOrder(nextOrder);
    } else {
      // const remittanceOrder: RemittanceOrder = {
      //   clientName: 'Remover',
      //   clientDocument: 'Remover',
      //   clientDocumentType: 'Remover',
      //   remittance: null,
      //   system: null,
      //   provider: cryptoRemittance.provider,
      //   quotationId:,
      //   currency:,
      //   price:,
      //   quantity:,
      //   side:,
      //   marketStatus:,
      //   fiatAmount:,
      //   orderId:,
      //   orderQuantity:,
      //   orderQuantityCurrency:,
      //   orderType:,
      //   orderPrice:,
      //   orderTimestamp:,
      //   createdAt:,
      // }
    }
  }

  private async processNaturalCryptoRemittance(
    amount: number,
    side: OrderSide,
    streamQuotation: StreamQuotation,
    system: System,
  ): Promise<CryptoRemittance> {
    // Get gateway from stream quotation
    const gateway = this.cryptoRemittanceGateways.find(
      (gateway) => gateway.getProviderName() === streamQuotation.gatewayName,
    );

    if (!gateway) {
      throw new CryptoRemittanceGatewayNotFoundException(
        streamQuotation.gatewayName,
      );
    }

    const gatewayName = gateway.getProviderName();

    this.logger.debug('Gateway found.', { gatewayName });

    const provider = await this.providerRepository.getByName(gatewayName);

    if (!provider) {
      throw new ProviderNotFoundException({ name: gatewayName });
    }

    // FIXME: Verificar se os dados estao vindo da cache local
    const market = await gateway.getCryptoMarketByBaseAndQuote({
      baseCurrency: streamQuotation.baseCurrency,
      quoteCurrency: streamQuotation.quoteCurrency,
    });

    if (!market) {
      throw new CryptoMarketNotFoundException({
        baseCurrency: streamQuotation.baseCurrency,
        quoteCurrency: streamQuotation.quoteCurrency,
        gatewayName: streamQuotation.gatewayName,
      });
    }

    this.logger.debug('Market found.', { market });

    // Check if amount is not over to market limit.
    amount = market.maxSize ? Math.min(market.maxSize, amount) : amount;

    // Check if amount is multiple of maket size increment.
    amount = market.sizeIncrement
      ? amount - (amount % market.sizeIncrement)
      : amount;

    // Check if amount is enough to market. If not, return.
    if (amount < 0 || (market.minSize && market.minSize > amount)) {
      return;
    }

    const cryptoRemittance = new CryptoRemittanceEntity({
      id: uuidV4(),
      baseCurrency: streamQuotation.baseCurrency,
      quoteCurrency: streamQuotation.quoteCurrency,
      market,
      amount,
      type: OrderType.MARKET,
      side,
      provider,
      providerName: streamQuotation.gatewayName,
    });

    this.logger.debug('Executing order.', { cryptoRemittance });

    // Call partner to create a conversion order.
    const createdRemittance =
      await gateway.createCryptoRemittance(cryptoRemittance);

    if (createdRemittance.status === CryptoRemittanceStatus.ERROR) {
      throw new CryptoRemittanceNotPlacedException(cryptoRemittance);
    }

    cryptoRemittance.providerOrderId = createdRemittance.providerOrderId;
    cryptoRemittance.providerName = createdRemittance.providerName;
    cryptoRemittance.status = createdRemittance.status;
    cryptoRemittance.executedPrice = createdRemittance.executedPrice;
    cryptoRemittance.executedAmount = createdRemittance.executedQuantity ?? 0;
    cryptoRemittance.fee = createdRemittance.fee ?? 0;

    switch (createdRemittance.status) {
      case CryptoRemittanceStatus.PENDING:
        this.cryptoRemittanceEventEmitter.pendingCryptoRemittance(
          cryptoRemittance,
        );
        break;
      case CryptoRemittanceStatus.WAITING:
        this.cryptoRemittanceEventEmitter.waitingCryptoRemittance(
          cryptoRemittance,
        );
        break;
      case CryptoRemittanceStatus.CANCELED:
        this.cryptoRemittanceEventEmitter.canceledCryptoRemittance(
          cryptoRemittance,
        );
        break;
      case CryptoRemittanceStatus.FILLED:
        this.cryptoRemittanceEventEmitter.filledCryptoRemittance({
          ...cryptoRemittance,
          systemName: system.name,
        });
        break;
    }

    // Store conversion order.
    await this.cryptoRemittanceRepository.create(cryptoRemittance);

    this.logger.info('Order executed.', { cryptoRemittance });

    return cryptoRemittance;
  }
}
