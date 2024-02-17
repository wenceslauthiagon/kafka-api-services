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

export class ReadyPortabilityClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly autoApprovePortabilityRequest: boolean,
  ) {
    this.logger = logger.child({
      context: ReadyPortabilityClaimProcessUseCase.name,
    });
  }

  /**
   * Ready portability process.
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
    if (
      pixKey.state === KeyState.PORTABILITY_REQUEST_PENDING ||
      pixKey.state === KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED
    ) {
      return pixKey;
    }

    if (!pixKey.isReadyState()) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Save claim
    const pixKeyClaim = new PixKeyClaimEntity({
      id: pixKey.claim.id,
      claimOpeningDate: new Date(),
    });

    if (!this.autoApprovePortabilityRequest) {
      // Change status for key
      pixKey.state = KeyState.PORTABILITY_REQUEST_PENDING;

      // Fire event.
      this.eventEmitter.portabilityRequestPendingPixKey(pixKey);

      this.logger.debug('Portability request pending.', { pixKey });
    } else {
      // Change status for key
      pixKey.state = KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED;

      // Save claim closing date.
      pixKeyClaim.claimClosingDate = new Date();

      // Fire event.
      this.eventEmitter.portabilityRequestAutoConfirmedPixKey(pixKey);

      this.logger.debug('Portability request auto approved.', { pixKey });
    }

    // Update pixKey claim.
    await this.pixKeyClaimRepository.update(pixKeyClaim);

    // Update pixKey state.
    await this.pixKeyRepository.update(pixKey);

    return pixKey;
  }
}
