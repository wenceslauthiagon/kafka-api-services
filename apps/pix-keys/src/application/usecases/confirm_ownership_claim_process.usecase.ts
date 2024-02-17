import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyGateway,
} from '@zro/pix-keys/application';

export class ConfirmOwnershipClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly pspGateway: PixKeyGateway,
    private readonly ispb: string,
  ) {
    this.logger = logger.child({
      context: ConfirmOwnershipClaimProcessUseCase.name,
    });
  }

  /**
   * Confirm ownership process.
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
    if (pixKey.state === KeyState.OWNERSHIP_CONFIRMED) {
      return pixKey;
    }

    if (
      ![KeyState.OWNERSHIP_STARTED, KeyState.OWNERSHIP_WAITING].includes(
        pixKey.state,
      )
    ) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    if (!pixKey.claim?.id) {
      throw new MissingDataException(['Pix Key Claim ID']);
    }

    const data = {
      key: pixKey.key,
      keyType: pixKey.type,
      claimId: pixKey.claim.id,
      ispb: this.ispb,
    };

    const response = await this.pspGateway.finishClaimPixKey(data);

    this.logger.debug('FinishClaim PixKey response.', { pixKey: response });

    // Change status for key
    pixKey.state = KeyState.OWNERSHIP_CONFIRMED;

    // Update pixKey state.
    await this.pixKeyRepository.update(pixKey);

    // Fire event.
    this.eventEmitter.ownershipConfirmedPixKey(pixKey);

    this.logger.debug('Ownership confirmed.', { pixKey });

    return pixKey;
  }
}
