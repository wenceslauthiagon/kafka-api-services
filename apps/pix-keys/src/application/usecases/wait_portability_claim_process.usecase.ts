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
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';

export class WaitPortabilityClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
  ) {
    this.logger = logger.child({
      context: WaitPortabilityClaimProcessUseCase.name,
    });
  }

  /**
   * Wait portability process.
   *
   * @param {string} key The Pix key.
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

    if (KeyState.PORTABILITY_STARTED !== pixKey.state) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Save claim opening date.
    const pixKeyClaim = new PixKeyClaimEntity({
      id: pixKey.claim.id,
      claimOpeningDate: new Date(),
    });

    await this.pixKeyClaimRepository.update(pixKeyClaim);

    this.logger.debug('Claim opening date saved.', { pixKeyClaim });

    return pixKey;
  }
}
