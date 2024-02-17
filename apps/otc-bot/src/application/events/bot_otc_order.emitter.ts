import { BotOtcOrder } from '@zro/otc-bot/domain';

export type BotOtcOrderEvent = BotOtcOrder;

export interface BotOtcOrderEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingBotOtcOrder: (event: BotOtcOrderEvent) => void;

  /**
   * Emit sold event.
   * @param event Data.
   */
  soldBotOtcOrder: (event: BotOtcOrderEvent) => void;

  /**
   * Emit filled event.
   * @param event Data.
   */
  filledBotOtcOrder: (event: BotOtcOrderEvent) => void;

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedBotOtcOrder: (event: BotOtcOrderEvent) => void;

  /**
   * Emit completed with remittance event.
   * @param event Data.
   */
  completedWithRemittanceBotOtcOrder: (event: BotOtcOrderEvent) => void;
}
