import { MissingDataException } from '@zro/common';
import { BotOtcOrder, BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { Logger } from 'winston';

export class GetBotOtcOrderByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param botOtcOrderRepository Bot otc order repository.
   */
  constructor(
    private logger: Logger,
    private readonly botOtcOrderRepository: BotOtcOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetBotOtcOrderByIdUseCase.name,
    });
  }

  async execute(id: string): Promise<BotOtcOrder> {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    const botOtcOrder = await this.botOtcOrderRepository.getById(id);

    this.logger.debug('Found bot otc order.', {
      botOtcOrder,
    });

    return botOtcOrder;
  }
}
