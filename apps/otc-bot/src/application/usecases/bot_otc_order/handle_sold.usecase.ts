import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';

import { MissingDataException } from '@zro/common';

import {
  OrderType,
  OrderSide,
  CryptoRemittanceStatus,
  CryptoOrderState,
  System,
} from '@zro/otc/domain';
import {
  BotOtcOrder,
  BotOtcOrderRepository,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';

import {
  BotOtcOrderNotFoundException,
  BotOtcOrderInvalidStateException,
  BotOtcOrderEventEmitter,
  OtcService,
  CreateCryptoRemittanceServiceRequest,
  CreateCryptoOrderServiceRequest,
} from '@zro/otc-bot/application';

export class HandleSoldBotOtcOrderUseCase {
  constructor(
    private logger: Logger,
    private botOtcOrderRepository: BotOtcOrderRepository,
    private botOtcOrderEventEmitter: BotOtcOrderEventEmitter,
    private otcService: OtcService,
    private system: System,
  ) {
    this.logger = logger.child({
      context: HandleSoldBotOtcOrderUseCase.name,
    });
  }

  async execute(botOtcOrder: BotOtcOrder): Promise<void> {
    // Sanity check.
    if (!botOtcOrder) {
      throw new MissingDataException(['Bot']);
    }

    const foundOrder = await this.botOtcOrderRepository.getById(botOtcOrder.id);

    this.logger.debug('Handling bot sold order.', { botOtcOrder: foundOrder });

    if (!foundOrder) {
      throw new BotOtcOrderNotFoundException(botOtcOrder);
    }

    botOtcOrder = foundOrder;

    // Indepotent retry
    if (botOtcOrder.state === BotOtcOrderState.FILLED) {
      return;
    }

    if (botOtcOrder.state !== BotOtcOrderState.SOLD) {
      throw new BotOtcOrderInvalidStateException(botOtcOrder);
    }

    // Store executed remittance.
    const createSellCryptoRemittanceRequest: CreateCryptoRemittanceServiceRequest =
      {
        id: uuidV4(),
        baseCurrency: botOtcOrder.baseCurrency,
        quoteCurrency: botOtcOrder.quoteCurrency,
        market: botOtcOrder.market,
        amount: botOtcOrder.sellExecutedAmount,
        type: OrderType.LIMIT,
        side: OrderSide.SELL,
        price: botOtcOrder.sellPrice,
        stopPrice: botOtcOrder.sellStopPrice,
        validUntil: botOtcOrder.sellValidUntil,
        provider: botOtcOrder.sellProvider,
        providerOrderId: botOtcOrder.sellProviderOrderId,
        providerName: botOtcOrder.sellProviderName,
        status: CryptoRemittanceStatus.FILLED,
        executedPrice: botOtcOrder.sellExecutedPrice,
        executedAmount: botOtcOrder.sellExecutedAmount,
      };

    await this.otcService.createCryptoRemittance(
      createSellCryptoRemittanceRequest,
    );

    this.logger.debug('Created new sell crypto remittance.', {
      cryptoRemittance: createSellCryptoRemittanceRequest,
    });

    // Store executed order
    const createSellCryptoOrder: CreateCryptoOrderServiceRequest = {
      id: uuidV4(),
      baseCurrency: botOtcOrder.baseCurrency,
      amount: botOtcOrder.sellExecutedAmount,
      type: OrderType.LIMIT,
      side: OrderSide.SELL,
      state: CryptoOrderState.CONFIRMED,
      system: this.system,
      provider: botOtcOrder.sellProvider,
      cryptoRemittance: createSellCryptoRemittanceRequest,
    };

    await this.otcService.createCryptoOrder(createSellCryptoOrder);

    this.logger.debug('Created new sell crypto order.', {
      cryptoOrder: createSellCryptoOrder,
    });

    // Create pending buy order
    const createBuyCryptoOrder: CreateCryptoOrderServiceRequest = {
      id: uuidV4(),
      baseCurrency: botOtcOrder.baseCurrency,
      amount: botOtcOrder.sellExecutedAmount,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      state: CryptoOrderState.PENDING,
      system: this.system,
    };

    await this.otcService.createCryptoOrder(createBuyCryptoOrder);

    this.logger.debug('Created new buy crypto order.', {
      cryptoOrder: createBuyCryptoOrder,
    });

    // Update bot order with created crypto orders.
    botOtcOrder.sellOrder = createSellCryptoOrder;
    botOtcOrder.buyOrder = createBuyCryptoOrder;
    botOtcOrder.state = BotOtcOrderState.FILLED;

    await this.botOtcOrderRepository.update(botOtcOrder);

    this.logger.debug('Otc order bot updated.', {
      botOtcOrder,
    });

    this.botOtcOrderEventEmitter.filledBotOtcOrder(botOtcOrder);
  }
}
