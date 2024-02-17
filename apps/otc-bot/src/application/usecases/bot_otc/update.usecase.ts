import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { BotOtcNotFoundException } from '@zro/otc-bot/application';
import { BotOtc, BotOtcRepository } from '@zro/otc-bot/domain';

export class UpdateBotOtcUseCase {
  /**
   * Default constructor.
   *
   */
  constructor(
    private logger: Logger,
    private readonly botOtcRepository: BotOtcRepository,
  ) {
    this.logger = logger.child({ context: UpdateBotOtcUseCase.name });
  }

  /**
   * Update BotOtc.
   *
   * @param botOtc BotOtc data.
   * @returns The updated BotOtc.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(botOtc: BotOtc): Promise<BotOtc> {
    if (!botOtc?.id) {
      throw new MissingDataException(['botOtc Id']);
    }

    if (
      !botOtc?.spread &&
      !botOtc?.step &&
      !botOtc?.control &&
      !botOtc?.balance
    ) {
      throw new MissingDataException(['botOtc Params']);
    }

    const foundBotOtc = await this.botOtcRepository.getById(botOtc.id);

    this.logger.debug('Found BotOtc.', { botOtc });

    if (!foundBotOtc) {
      throw new BotOtcNotFoundException({ id: botOtc.id });
    }

    foundBotOtc.control = botOtc.control ?? foundBotOtc.control;
    foundBotOtc.balance = botOtc.balance ?? foundBotOtc.balance;
    foundBotOtc.step = botOtc.step ?? foundBotOtc.step;
    foundBotOtc.spread = botOtc.spread ?? foundBotOtc.spread;

    // Update botOtc.
    await this.botOtcRepository.update(foundBotOtc);

    this.logger.debug('BotOtc updated.', { botOtc: foundBotOtc });

    return foundBotOtc;
  }
}
