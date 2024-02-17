import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
  getMoment,
  MissingDataException,
} from '@zro/common';
import {
  BotOtc,
  BotOtcOrderEntity,
  BotOtcOrderRepository,
  BotOtcOrderState,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import {
  BotOtcConfigurationFailedException,
  BotOtcNotFoundException,
  QuotationService,
  OtcService,
  OperationService,
} from '@zro/otc-bot/application';
import { StreamPairEntity } from '@zro/quotations/domain';
import {
  CryptoRemittanceEntity,
  CryptoRemittanceStatus,
  OrderSide,
  OrderType,
  ProviderEntity,
} from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  CryptoMarketNotFoundException,
  CryptoRemittanceAmountUnderflowException,
  CryptoRemittanceGateway,
  CryptoRemittanceInvalidNotionalException,
  ProviderNotFoundException,
} from '@zro/otc/application';
import { StreamPairNotFoundException } from '@zro/quotations/application';
import { CurrencyNotFoundException } from '@zro/operations/application';

export class RunSpreadBotUseCase {
  constructor(
    private logger: Logger,
    private botOtcRepository: BotOtcRepository,
    private botOtcOrderRepository: BotOtcOrderRepository,
    private quotationService: QuotationService,
    private otcService: OtcService,
    private operationService: OperationService,
    private cryptoRemittanceGateways: CryptoRemittanceGateway[],
  ) {
    this.logger = logger.child({ context: RunSpreadBotUseCase.name });
  }

  async execute(bot: BotOtc): Promise<void> {
    // Sanity check.
    if (!bot) {
      throw new MissingDataException(['Bot']);
    }

    const foundBot = await this.botOtcRepository.getById(bot.id);

    this.logger.debug('Found Bot OTC.', { bot: foundBot });

    if (!foundBot) {
      throw new BotOtcNotFoundException({ id: bot.id });
    }

    bot = foundBot;

    // Check if the bot has funds.
    if (bot.balance <= 0 || bot.balance < bot.step) {
      this.logger.debug('Not enough Bot OTC funds.', { bot });
      return;
    }

    // Check if the bot is already stopped.
    if (bot.shouldStop()) {
      this.logger.debug('Bot OTC should stop.', { bot });
      return;
    }

    // Check if there is another bot order in process.
    const foundOrders =
      await this.botOtcOrderRepository.getAllByBotOtcAndStateIn(bot, [
        BotOtcOrderState.PENDING,
        BotOtcOrderState.SOLD,
      ]);

    if (foundOrders?.length) {
      this.logger.debug('Found Bot OTC orders in process.', { foundOrders });
      return;
    }

    // Get bot pairs
    const fromPair = await this.quotationService.getStreamPairById({
      id: bot.fromPair.id,
    });

    this.logger.debug('Found From Stream Pair.', { streamPair: fromPair });

    if (!fromPair) {
      throw new StreamPairNotFoundException(bot.fromPair);
    }

    const toPair = await this.quotationService.getStreamPairById({
      id: bot.toPair.id,
    });

    this.logger.debug('Found To Stream Pair.', { streamPair: toPair });

    if (!toPair) {
      throw new StreamPairNotFoundException(bot.toPair);
    }

    // Get bot providers
    const fromProvider = await this.otcService.getProviderById({
      id: bot.fromProvider.id,
    });

    this.logger.debug('Found From Provider.', { provider: fromProvider });

    if (!fromProvider) {
      throw new ProviderNotFoundException(bot.fromProvider);
    }

    const fromGateway = this.cryptoRemittanceGateways.find(
      (gw) => gw.getProviderName() === fromProvider.name,
    );
    if (!fromGateway) {
      throw new BotOtcConfigurationFailedException(['From Gateway Not Found']);
    }

    const toProvider = await this.otcService.getProviderById({
      id: bot.toProvider.id,
    });

    this.logger.debug('Found To Provider.', { provider: toProvider });

    if (!toProvider) {
      throw new ProviderNotFoundException(bot.toProvider);
    }

    const toGateway = this.cryptoRemittanceGateways.find(
      (gw) => gw.getProviderName() === toProvider.name,
    );
    if (!toGateway) {
      throw new BotOtcConfigurationFailedException(['To Gateway Not Found']);
    }

    // Update bot references
    bot.toPair = new StreamPairEntity(toPair);
    bot.fromPair = new StreamPairEntity(fromPair);
    bot.toProvider = new ProviderEntity(toProvider);
    bot.fromProvider = new ProviderEntity(fromProvider);

    if (!bot.fromPair.gatewayName.includes(bot.fromProvider.name)) {
      throw new BotOtcConfigurationFailedException([
        'From Stream Pair gateway name diverges From Provider name',
      ]);
    }

    if (!bot.toPair.gatewayName.includes(bot.toProvider.name)) {
      throw new BotOtcConfigurationFailedException([
        'To Stream Pair gateway name diverges To Provider name',
      ]);
    }

    if (!bot.fromPair.active) {
      throw new BotOtcConfigurationFailedException([
        'From Stream Pair Is Not Active',
      ]);
    }

    if (!bot.toPair.active) {
      throw new BotOtcConfigurationFailedException([
        'To Stream Pair Is Not Active',
      ]);
    }

    // Get bot currencies
    const fromBaseCurrency = await this.operationService.getCurrencyById({
      id: bot.fromPair.baseCurrency.id,
    });

    this.logger.debug('Found From Base Currency.', {
      currency: fromBaseCurrency,
    });

    if (!fromBaseCurrency) {
      throw new CurrencyNotFoundException(bot.fromPair.baseCurrency);
    }

    const fromQuoteCurrency = await this.operationService.getCurrencyById({
      id: bot.fromPair.quoteCurrency.id,
    });

    this.logger.debug('Found From Quote Currency.', {
      currency: fromQuoteCurrency,
    });

    if (!fromQuoteCurrency) {
      throw new CurrencyNotFoundException(bot.fromPair.quoteCurrency);
    }

    const toBaseCurrency = await this.operationService.getCurrencyById({
      id: bot.toPair.baseCurrency.id,
    });

    this.logger.debug('Found To Base Currency.', { currency: toBaseCurrency });

    if (!toBaseCurrency) {
      throw new CurrencyNotFoundException(bot.toPair.baseCurrency);
    }

    const toQuoteCurrency = await this.operationService.getCurrencyById({
      id: bot.toPair.quoteCurrency.id,
    });

    this.logger.debug('Found To Quote Currency.', {
      currency: toQuoteCurrency,
    });

    if (!toQuoteCurrency) {
      throw new CurrencyNotFoundException(bot.toPair.quoteCurrency);
    }

    // Update bot
    bot.fromPair.baseCurrency = new CurrencyEntity(fromBaseCurrency);
    bot.fromPair.quoteCurrency = new CurrencyEntity(fromQuoteCurrency);
    bot.toPair.baseCurrency = new CurrencyEntity(toBaseCurrency);
    bot.toPair.quoteCurrency = new CurrencyEntity(toQuoteCurrency);

    // Get bot quotation target.
    const streamQuotation =
      await this.quotationService.getStreamQuotationByBaseAndQuoteAndGatewayName(
        {
          baseCurrency: bot.fromPair.baseCurrency,
          quoteCurrency: bot.fromPair.quoteCurrency,
          gatewayName: bot.fromPair.gatewayName,
        },
      );

    this.logger.debug('Stream Quotation found.', { streamQuotation });

    if (!streamQuotation?.buy) {
      this.logger.debug('No Stream Quotation found.', { bot });
      return;
    }

    // FIXME: Verificar se os dados estao vindo da cache local
    const toMarket = await toGateway.getCryptoMarketByBaseAndQuote({
      baseCurrency: bot.toPair.baseCurrency,
      quoteCurrency: bot.toPair.quoteCurrency,
    });

    this.logger.debug('To Crypto Market found.', { market: toMarket });

    if (!toMarket) {
      throw new CryptoMarketNotFoundException({
        baseCurrency: bot.toPair.baseCurrency,
        quoteCurrency: bot.toPair.quoteCurrency,
        gatewayName: bot.toProvider.name,
      });
    }

    const toSide = OrderSide.SELL;
    const spread = bot.spreadFloat;
    let fromPrice = streamQuotation.buy;
    let toPrice = fromPrice * (1 + spread);
    let amount = bot.step;

    fromPrice = formatValueFromFloatToInt(fromPrice, fromQuoteCurrency.decimal);
    toPrice = formatValueFromFloatToInt(
      toPrice,
      toMarket.priceSignificantDigits ?? 0,
    );

    // Check if amount is not over to market limit.
    amount = toMarket.maxSize ? Math.min(toMarket.maxSize, amount) : amount;

    // Check if amount is multiple of market size increment constraint.
    amount = toMarket.sizeIncrement
      ? amount - (amount % toMarket.sizeIncrement)
      : amount;

    // Check if price is multiple of price increment constraint.
    toPrice = toMarket.priceIncrement
      ? toPrice - (toPrice % toMarket.priceIncrement)
      : toPrice;

    this.logger.debug('Bot OTC prices.', {
      fromPrice,
      spread,
      toPrice,
      amount,
    });

    // Check if amount is enough to market.
    if (amount <= 0 || (toMarket.minSize && toMarket.minSize > amount)) {
      throw new CryptoRemittanceAmountUnderflowException(
        amount,
        toMarket,
        toSide,
      );
    }

    // Check if notional is enough to market.
    if (toMarket.minNotional || toMarket.maxNotional) {
      const notional =
        toPrice *
        formatValueFromIntToFloat(amount, toMarket.baseCurrency.decimal);

      if (
        (toMarket.minNotional && notional < toMarket.minNotional) ||
        (toMarket.maxNotional && notional > toMarket.maxNotional)
      ) {
        throw new CryptoRemittanceInvalidNotionalException(notional, toMarket);
      }
    }

    const validUntil = toMarket.requireValidUntil
      ? getMoment().add(5, 'minutes').toDate()
      : null;

    const toCryptoRemittance = new CryptoRemittanceEntity({
      id: uuidV4(),
      baseCurrency: bot.toPair.baseCurrency,
      quoteCurrency: bot.toPair.quoteCurrency,
      market: toMarket,
      amount,
      type: OrderType.LIMIT,
      side: toSide,
      provider: toProvider,
      providerName: bot.toProvider.name,
      price: toPrice,
      validUntil,
      // FIXME: Colocar o stop price.
    });

    this.logger.debug('Create Crypto Remittance request.', {
      toCryptoRemittance,
    });

    // Create limit order in gateway
    const toResult = await toGateway.createCryptoRemittance(toCryptoRemittance);

    this.logger.debug('Create Crypto Remittance response.', { toResult });

    // Check if crypto remittance was successfully placed.
    if (
      !toResult ||
      [CryptoRemittanceStatus.ERROR, CryptoRemittanceStatus.CANCELED].includes(
        toResult?.status,
      )
    )
      return;

    // Update bot balance.
    bot.balance -= amount;

    const botOrder = new BotOtcOrderEntity({
      id: uuidV4(),
      botOtc: bot,
      state: BotOtcOrderState.PENDING,
      baseCurrency: bot.toPair.baseCurrency,
      quoteCurrency: bot.toPair.quoteCurrency,
      market: toMarket,
      amount,
      type: OrderType.LIMIT,
      sellStatus: toResult.status,
      sellProvider: toProvider,
      sellProviderName: bot.toProvider.name,
      sellPrice: toPrice,
      sellValidUntil: validUntil,
      sellProviderOrderId: toResult.providerOrderId,
    });

    // Store data.
    await this.botOtcRepository.update(bot);

    this.logger.debug('Bot otc updated.', { botOtc: bot });

    await this.botOtcOrderRepository.create(botOrder);

    this.logger.debug('Bot otc order created.', { botOrder });
  }
}
