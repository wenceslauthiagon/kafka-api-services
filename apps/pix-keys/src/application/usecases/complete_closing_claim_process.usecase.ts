import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class CompleteClosingClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: CompleteClosingClaimProcessUseCase.name,
    });
  }

  /**
   * Complete closing claim process.
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
    if (pixKey.state === KeyState.CLAIM_CLOSED) {
      return pixKey;
    }

    if (KeyState.CLAIM_CLOSING !== pixKey.state) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Change status for key
    pixKey.state = KeyState.CLAIM_CLOSED;

    // Update pixKey state.
    await this.pixKeyRepository.update(pixKey);

    // Fire event.
    this.eventEmitter.claimClosedPixKey(pixKey);

    this.logger.debug('Claim closed.', { pixKey });

    return pixKey;
  }
}
