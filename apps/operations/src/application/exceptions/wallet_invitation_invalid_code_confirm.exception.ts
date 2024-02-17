import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'WALLET_INVITATION_INVALID_CODE_CONFIRM')
export class WalletInvitationInvalidCodeConfirmException extends DefaultException {
  constructor(code: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_INVITATION_INVALID_CODE_CONFIRM',
      data: { code },
    });
  }
}
