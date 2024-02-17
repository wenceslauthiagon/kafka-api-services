import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BotOtcOrder } from '@zro/otc-bot/domain';

@Exception(ExceptionTypes.USER, 'BOT_OTC_ORDER_INVALID_STATE')
export class BotOtcOrderInvalidStateException extends DefaultException {
  constructor(order: BotOtcOrder) {
    super({
      code: 'BOT_OTC_ORDER_INVALID_STATE',
      type: ExceptionTypes.USER,
      data: order,
    });
  }
}
