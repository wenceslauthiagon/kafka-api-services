import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  KeyState,
  PixKey,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class CancelOwnershipClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: CancelOwnershipClaimProcessUseCase.name,
    });
  }

  /**
   * Cancel ownership process.
   *
   * @param {string} key The key.
   * @returns {PixKey} Key found.
   */
  async execute(key: string): Promise<PixKey> {
    // Data input check
    if (!key) {
      throw new MissingDataException(['Key']);
    }

    // Search pixKey
    const [pixKey] =
      await this.pixKeyRepository.getByKeyAndStateIsNotCanceled(key);

    this.logger.debug('Found pix key.', { pixKey });

    // Key is canceled or is not owned by user.
    if (!pixKey) {
      throw new PixKeyNotFoundException({ key });
    }

    // Indepotent execution.
    if (pixKey.state === KeyState.OWNERSHIP_CANCELED) {
      return pixKey;
    }

    if (
      ![
        KeyState.OWNERSHIP_STARTED,
        KeyState.OWNERSHIP_WAITING,
        KeyState.OWNERSHIP_CONFIRMED,
      ].includes(pixKey.state)
    ) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Change status for key
    pixKey.state = KeyState.OWNERSHIP_CANCELED;

    // Update pixKey state.
    await this.pixKeyRepository.update(pixKey);

    // Save claim closing date.
    const pixKeyClaim = new PixKeyClaimEntity({
      id: pixKey.claim.id,
      claimClosingDate: new Date(),
    });

    await this.pixKeyClaimRepository.update(pixKeyClaim);

    // Fire event.
    this.eventEmitter.ownershipCanceledPixKey(pixKey);

    this.logger.debug('Ownership canceled.', { pixKey });

    return pixKey;
  }
}
