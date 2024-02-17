import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletInvitation } from '@zro/operations/domain';

/**
 * Thrown when wallet invitation was not permitted in database.
 */
@Exception(ExceptionTypes.USER, 'WALLET_INVITATION_NOT_PERMITTED')
export class WalletInvitationNotPermittedException extends DefaultException {
  constructor(data: Partial<WalletInvitation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_INVITATION_NOT_PERMITTED',
      data,
    });
  }
}
