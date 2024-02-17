import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  ClaimStatusType,
  KeyState,
  PixKey,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class CancelingPortabilityClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: CancelingPortabilityClaimProcessUseCase.name,
    });
  }

  /**
   * Canceling portability process.
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
    if (pixKey.state === KeyState.PORTABILITY_CANCELING) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_STARTED) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    if (!pixKey.claim?.id) {
      throw new MissingDataException(['Pix Key Claim ID']);
    }

    const claimFound = await this.pixKeyClaimRepository.getById(
      pixKey.claim.id,
    );

    if (
      !claimFound ||
      claimFound.status !== ClaimStatusType.WAITING_RESOLUTION
    ) {
      this.logger.debug('Pix Key Claim found by key.', { claim: claimFound });

      throw new PixKeyInvalidStateException(pixKey);
    }

    // Change status for key
    pixKey.state = KeyState.PORTABILITY_CANCELING;

    // Update pixKey state.
    await this.pixKeyRepository.update(pixKey);

    // Fire event.
    this.eventEmitter.portabilityCancelingPixKey(pixKey, reason);

    this.logger.debug('Portability canceling.', { pixKey });

    return pixKey;
  }
}
