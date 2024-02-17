import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class ConfirmPortabilityClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: ConfirmPortabilityClaimProcessUseCase.name,
    });
  }

  /**
   * Confirm portability process.
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
    if (pixKey.state === KeyState.PORTABILITY_CONFIRMED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_STARTED) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Change status for key
    pixKey.state = KeyState.PORTABILITY_CONFIRMED;

    // Update pixKey state.
    await this.pixKeyRepository.update(pixKey);

    // Fire event.
    this.eventEmitter.portabilityConfirmedPixKey(pixKey);

    this.logger.debug('Portability confirmed.', { pixKey });

    return pixKey;
  }
}
