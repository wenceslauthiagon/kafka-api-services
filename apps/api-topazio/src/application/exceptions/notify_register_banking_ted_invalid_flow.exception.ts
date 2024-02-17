import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyRegisterBankingTed } from '@zro/api-topazio/domain';

@Exception(ExceptionTypes.USER, 'NOTIFY_REGISTER_BANKING_TED_INVALID_FLOW')
export class NotifyRegisterBankingTedInvalidFlowException extends DefaultException {
  constructor(notify: Partial<NotifyRegisterBankingTed>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_REGISTER_BANKING_TED_INVALID_FLOW',
      data: notify,
    });
  }
}
