import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BotOtcOrder } from '@zro/otc-bot/domain';

@Exception(ExceptionTypes.USER, 'BOT_OTC_ORDER_SELL_ORDER_NOT_DELETED')
export class BotOtcOrderSellOrderNotDeletedException extends DefaultException {
  constructor(botOtcOrder: Partial<BotOtcOrder>) {
    super({
      code: 'BOT_OTC_ORDER_SELL_ORDER_NOT_DELETED',
      type: ExceptionTypes.USER,
      data: botOtcOrder,
    });
  }
}
