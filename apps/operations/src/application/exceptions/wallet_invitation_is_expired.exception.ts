import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletInvitation } from '@zro/operations/domain';

@Exception(ExceptionTypes.USER, 'WALLET_INVITATION_IS_EXPIRED')
export class WalletInvitationIsExpiredException extends DefaultException {
  constructor(data: Partial<WalletInvitation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_INVITATION_IS_EXPIRED',
      data,
    });
  }
}
