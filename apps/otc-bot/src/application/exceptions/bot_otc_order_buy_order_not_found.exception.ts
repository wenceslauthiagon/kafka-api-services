import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BotOtcOrder } from '@zro/otc-bot/domain';

@Exception(ExceptionTypes.USER, 'BOT_OTC_ORDER_BUY_ORDER_NOT_FOUND')
export class BotOtcOrderBuyOrderNotFoundException extends DefaultException {
  constructor(botOtcOrder: Partial<BotOtcOrder>) {
    super({
      code: 'BOT_OTC_ORDER_BUY_ORDER_NOT_FOUND',
      type: ExceptionTypes.USER,
      data: botOtcOrder,
    });
  }
}
