import { Logger } from 'winston';
import {
  BotOtcOrder,
  BotOtcOrderRepository,
  BotOtcOrderState,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import {
  BotOtcOrderNotFoundException,
  BotOtcOrderInvalidStateException,
  BotOtcOrderConfigurationFailedException,
  BotOtcOrderEventEmitter,
  BotOtcOrderSellOrderNotFoundException,
  BotOtcOrderSellOrderNotDeletedException,
} from '@zro/otc-bot/application';
import { MissingDataException } from '@zro/common';
import { CryptoRemittanceGateway } from '@zro/otc/application';
import { CryptoRemittanceStatus } from '@zro/otc/domain';

export class HandlePendingBotOtcOrderUseCase {
  constructor(
    private logger: Logger,
    private botOtcRepository: BotOtcRepository,
    private botOtcOrderRepository: BotOtcOrderRepository,
    private botOtcOrderEventEmitter: BotOtcOrderEventEmitter,
    private cryptoRemittanceGateways: CryptoRemittanceGateway[],
  ) {
    this.logger = logger.child({
      context: HandlePendingBotOtcOrderUseCase.name,
    });
  }

  async execute(botOtcOrder: BotOtcOrder): Promise<void> {
    // Sanity check.
    if (!botOtcOrder) {
      throw new MissingDataException(['Bot']);
    }

    const foundOrder = await this.botOtcOrderRepository.getById(botOtcOrder.id);

    this.logger.debug('Handling bot pending order.', {
      botOtcOrder: foundOrder,
    });

    if (!foundOrder) {
      throw new BotOtcOrderNotFoundException(botOtcOrder);
    }

    botOtcOrder = foundOrder;

    if (botOtcOrder.state !== BotOtcOrderState.PENDING) {
      throw new BotOtcOrderInvalidStateException(botOtcOrder);
    }

    const toGateway = this.cryptoRemittanceGateways.find(
      (gateway) => gateway.getProviderName() === botOtcOrder.sellProviderName,
    );

    if (!toGateway) {
      throw new BotOtcOrderConfigurationFailedException([
        'To gateway not available',
      ]);
    }

    // Get remittance status in gateway
    const toCryptoRemittance = await toGateway.getCryptoRemittanceById({
      providerOrderId: botOtcOrder.sellProviderOrderId,
      baseCurrency: botOtcOrder.baseCurrency,
      quoteCurrency: botOtcOrder.quoteCurrency,
      market: botOtcOrder.market,
    });

    this.logger.debug('To Crypto Remittance found.', {
      cryptoRemittance: toCryptoRemittance,
    });

    if (!toCryptoRemittance) {
      throw new BotOtcOrderSellOrderNotFoundException(foundOrder);
    }

    botOtcOrder.sellExecutedPrice = toCryptoRemittance.executedPrice;
    botOtcOrder.sellExecutedAmount = toCryptoRemittance.executedQuantity;
    botOtcOrder.sellStatus = toCryptoRemittance.status;

    // Cancel crypto remittance if sell order was not successfully placed.
    if (
      [CryptoRemittanceStatus.PENDING, CryptoRemittanceStatus.WAITING].includes(
        toCryptoRemittance.status,
      ) ||
      botOtcOrder.sellExecutedAmount < botOtcOrder.amount
    ) {
      this.logger.debug('Bot otc order sell provider order was not filled.', {
        botOtcOrder,
      });

      const deletedOrder = await toGateway.deleteCryptoRemittanceById({
        id: botOtcOrder.sellProviderOrderId,
        baseCurrency: botOtcOrder.baseCurrency,
        quoteCurrency: botOtcOrder.quoteCurrency,
      });

      this.logger.debug('Bot otc order sell provider order deleted.', {
        deletedOrder,
      });

      if (!deletedOrder?.id) {
        throw new BotOtcOrderSellOrderNotDeletedException(botOtcOrder);
      }
    }

    // Get bot otc.
    const botOtc = await this.botOtcRepository.getById(botOtcOrder.botOtc.id);

    this.logger.debug('Bot otc found.', { botOtc });

    // Delete bot otc order if sell order was not successfully placed.
    if (toCryptoRemittance.status !== CryptoRemittanceStatus.FILLED) {
      await this.botOtcOrderRepository.delete(botOtcOrder);

      this.logger.debug('Bot otc order was not filled and now deleted.', {
        botOtcOrder,
      });

      // Update bot balance.
      botOtc.balance += botOtcOrder.amount;
      await this.botOtcRepository.update(botOtc);

      this.logger.debug('Bot otc updated.', { botOtc });

      return;
    }

    //  Bot orc order sell order was successfully placed.
    botOtcOrder.state = BotOtcOrderState.SOLD;
    await this.botOtcOrderRepository.update(botOtcOrder);

    this.logger.debug('Bot otc order was sold successfully.', {
      botOtcOrder,
    });

    // Emit SOLD event.
    this.botOtcOrderEventEmitter.soldBotOtcOrder(botOtcOrder);
  }
}
