import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BotOtcOrder } from '@zro/otc-bot/domain';

@Exception(ExceptionTypes.USER, 'BOT_OTC_ORDER_NOT_FOUND')
export class BotOtcOrderNotFoundException extends DefaultException {
  constructor(botOtcOrder: Partial<BotOtcOrder>) {
    super({
      code: 'BOT_OTC_ORDER_NOT_FOUND',
      type: ExceptionTypes.SYSTEM,
      data: botOtcOrder,
    });
  }
}
