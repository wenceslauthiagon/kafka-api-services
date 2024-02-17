import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BotOtc } from '@zro/otc-bot/domain';

@Exception(ExceptionTypes.USER, 'BOT_OTC_INVALID_CONTROL')
export class BotOtcInvalidControlException extends DefaultException {
  constructor(data: Partial<BotOtc>) {
    super({
      code: 'BOT_OTC_INVALID_CONTROL',
      type: ExceptionTypes.USER,
      data,
    });
  }
}
