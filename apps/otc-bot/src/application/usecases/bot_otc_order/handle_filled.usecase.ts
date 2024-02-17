import { Logger } from 'winston';
import {
  BotOtcOrderRepository,
  BotOtcOrderRequestSort,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import {
  BotOtcOrderEventEmitter,
  OtcService,
  BotOtcOrderBuyOrderNotFoundException,
} from '@zro/otc-bot/application';
import { PaginationEntity, PaginationOrder } from '@zro/common';
import {
  CryptoOrderState,
  CryptoRemittanceStatus,
  ProviderEntity,
} from '@zro/otc/domain';
import {
  CryptoOrderNotFoundException,
  CryptoRemittanceNotFoundException,
} from '@zro/otc/application';

export class HandleFilledBotOtcOrderUseCase {
  private readonly PAGE_SIZE = 100;
  private readonly FIRST_PAGE = 1;

  constructor(
    private logger: Logger,
    private botOtcOrderRepository: BotOtcOrderRepository,
    private otcService: OtcService,
    private botOtcOrderEventEmitter: BotOtcOrderEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFilledBotOtcOrderUseCase.name,
    });
  }

  async execute(): Promise<void> {
    // Initial pagination.
    const pagination = new PaginationEntity({
      page: this.FIRST_PAGE,
      pageSize: this.PAGE_SIZE,
      sort: BotOtcOrderRequestSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    // While there are more pages to analyze the data, go on.
    let goOn = true;

    while (goOn) {
      // Get all open remittance.
      const filledOrders =
        await this.botOtcOrderRepository.getAllByPaginationAndStateIn(
          pagination,
          [BotOtcOrderState.FILLED],
        );

      this.logger.debug('Filled bot otc orders found.', {
        botOtcOrders: filledOrders?.data,
      });

      // If no filled bot otc order is found, terminate this cron job.
      if (!filledOrders?.data?.length) return;

      for (const botOtcOrder of filledOrders.data) {
        // Sanitize.
        if (botOtcOrder.state !== BotOtcOrderState.FILLED) continue;

        if (!botOtcOrder.buyOrder?.id) {
          throw new BotOtcOrderBuyOrderNotFoundException(botOtcOrder);
        }

        const cryptoOrder = await this.otcService.getCryptoOrderById({
          id: botOtcOrder.buyOrder.id,
        });

        this.logger.debug('Crypto order found.', {
          cryptoOrder,
        });

        if (!cryptoOrder) {
          throw new CryptoOrderNotFoundException({
            id: botOtcOrder.buyOrder.id,
          });
        }

        // If crypto order has not been confirmed, go to next order.
        if (cryptoOrder.state !== CryptoOrderState.CONFIRMED) continue;

        const cryptoRemittance = await this.otcService.getCryptoRemittanceById({
          id: cryptoOrder.cryptoRemittance.id,
        });

        this.logger.debug('Crypto remittance found.', {
          cryptoRemittance,
        });

        if (!cryptoRemittance) {
          throw new CryptoRemittanceNotFoundException({
            id: cryptoOrder.cryptoRemittance.id,
          });
        }

        // If crypto remittance has not been filled, go to next order.
        if (cryptoRemittance.status !== CryptoRemittanceStatus.FILLED) continue;

        // Update bot otc order.
        botOtcOrder.buyProvider = new ProviderEntity({
          id: cryptoRemittance.provider.id,
          name: cryptoRemittance.providerName,
        });
        botOtcOrder.buyProviderOrderId = cryptoRemittance.providerOrderId;
        botOtcOrder.buyProviderName = cryptoRemittance.providerName;
        botOtcOrder.buyExecutedPrice = cryptoRemittance.executedPrice;
        botOtcOrder.buyExecutedAmount = cryptoOrder.amount;
        botOtcOrder.buyPriceSignificantDigits =
          cryptoRemittance.market.priceSignificantDigits;
        botOtcOrder.state = BotOtcOrderState.COMPLETED;

        await this.botOtcOrderRepository.update(botOtcOrder);

        this.logger.debug('Bot otc order updated to completed successfully.', {
          botOtcOrder,
        });

        this.botOtcOrderEventEmitter.completedBotOtcOrder(botOtcOrder);
      }

      if (filledOrders.page >= filledOrders.pageTotal) {
        goOn = false;
      }

      pagination.page += 1;
    }
  }
}
