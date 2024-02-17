import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletInvitation } from '@zro/operations/domain';

/**
 * Thrown when wallet invitation already exists in database.
 */
@Exception(ExceptionTypes.USER, 'WALLET_INVITATION_ALREADY_EXISTS')
export class WalletInvitationAlreadyExistsException extends DefaultException {
  constructor(data: Partial<WalletInvitation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_INVITATION_ALREADY_EXISTS',
      data,
    });
  }
}
