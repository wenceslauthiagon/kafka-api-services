import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class CancelingOwnershipClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: CancelingOwnershipClaimProcessUseCase.name,
    });
  }

  /**
   * Canceling ownership process.
   *
   * @param user Keys' owner.
   * @param id The key.
   * @param reason The claim reason.
   * @returns Key found.
   */
  async execute(
    user: User,
    id: string,
    reason: ClaimReasonType,
  ): Promise<PixKey> {
    // Data input check
    if (!user || !id || !reason) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!id ? ['ID'] : []),
        ...(!reason ? ['Reason'] : []),
      ]);
    }

    // Search pixKey
    const pixKey =
      await this.pixKeyRepository.getByUserAndIdAndStateIsNotCanceled(user, id);

    this.logger.debug('Found pix key.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indepotent execution.
    if (pixKey.state === KeyState.OWNERSHIP_CANCELING) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.OWNERSHIP_WAITING) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Change status for key
    pixKey.state = KeyState.OWNERSHIP_CANCELING;

    // Update pixKey state.
    await this.pixKeyRepository.update(pixKey);

    // Fire event.
    this.eventEmitter.ownershipCancelingPixKey(pixKey, reason);

    this.logger.debug('Ownership canceling.', { pixKey });

    return pixKey;
  }
}
