import { MissingDataException } from '@zro/common';
import { Logger } from 'winston';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { CryptoOrder, Remittance } from '@zro/otc/domain';
import {
  BotOtcOrderEventEmitter,
  BotOtcOrderNotFoundException,
  OtcService,
} from '@zro/otc-bot/application';
import { RemittanceNotFoundException } from '@zro/otc/application';

export class UpdateBotOtcOrderByRemittanceUseCase {
  constructor(
    private logger: Logger,
    private botOtcOrderRepository: BotOtcOrderRepository,
    private botOtcOrderEventEmitter: BotOtcOrderEventEmitter,
    private otcService: OtcService,
  ) {
    this.logger = logger.child({
      context: UpdateBotOtcOrderByRemittanceUseCase.name,
    });
  }

  async execute(
    cryptoOrder: CryptoOrder,
    remittance: Remittance,
  ): Promise<void> {
    if (!cryptoOrder?.id || !remittance?.id || !remittance?.bankQuote) {
      throw new MissingDataException([
        ...(!cryptoOrder?.id ? ['Crypto Order ID'] : []),
        ...(!remittance?.id ? ['Remittance ID'] : []),
        ...(!remittance?.bankQuote ? ['Bank Quote'] : []),
      ]);
    }

    const foundRemittance = await this.otcService.getRemittanceById({
      id: remittance.id,
    });

    this.logger.debug('Remittance found.', { remittance: foundRemittance });

    if (!foundRemittance) {
      throw new RemittanceNotFoundException(remittance);
    }

    const botOtcOrder =
      await this.botOtcOrderRepository.getByBuyCryptoOrder(cryptoOrder);

    this.logger.debug('Bot otc order found.', { botOtcOrder });

    if (!botOtcOrder)
      throw new BotOtcOrderNotFoundException({ buyOrder: cryptoOrder });

    botOtcOrder.buyRemittance = remittance;

    await this.botOtcOrderRepository.update(botOtcOrder);

    this.logger.debug('Bot otc order updated.', { botOtcOrder });

    this.botOtcOrderEventEmitter.completedWithRemittanceBotOtcOrder(
      botOtcOrder,
    );
  }
}
