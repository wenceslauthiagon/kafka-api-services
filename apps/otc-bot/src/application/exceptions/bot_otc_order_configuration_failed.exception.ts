import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'BOT_OTC_ORDER_CONFIGURATION_FAILED')
export class BotOtcOrderConfigurationFailedException extends DefaultException {
  constructor(configs: string[]) {
    super({
      code: 'BOT_OTC_ORDER_CONFIGURATION_FAILED',
      type: ExceptionTypes.USER,
      data: configs,
    });
  }
}
