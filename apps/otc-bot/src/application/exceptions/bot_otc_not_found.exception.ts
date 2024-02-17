import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BotOtc } from '@zro/otc-bot/domain';

@Exception(ExceptionTypes.USER, 'BOT_OTC_NOT_FOUND')
export class BotOtcNotFoundException extends DefaultException {
  constructor(data: Partial<BotOtc>) {
    super({
      code: 'BOT_OTC_NOT_FOUND',
      type: ExceptionTypes.USER,
      data,
    });
  }
}
