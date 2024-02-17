import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletInvitation } from '@zro/operations/domain';

/**
 * Thrown when wallet invitation was not found in database.
 */
@Exception(ExceptionTypes.USER, 'WALLET_INVITATION_NOT_FOUND')
export class WalletInvitationNotFoundException extends DefaultException {
  constructor(data: Partial<WalletInvitation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_INVITATION_NOT_FOUND',
      data,
    });
  }
}
