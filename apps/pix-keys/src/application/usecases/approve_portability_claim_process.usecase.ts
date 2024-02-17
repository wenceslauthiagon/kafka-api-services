import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  ClaimReasonType,
  KeyState,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class ApprovePortabilityClaimProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: ApprovePortabilityClaimProcessUseCase.name,
    });
  }

  /**
   * Approve portability process. A request will be sent to DICT to claim for a key.
   *
   * @param {User} user Keys' owner.
   * @param {UUID} id The key id.
   * @param {ClaimReasonType} reason The claim reason.
   * @returns {PixKey} Key found.
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

    // Key is canceled or is not owned by user.
    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indepotent execution.
    if (pixKey.state === KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_REQUEST_PENDING) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Key is ready to be claimed on DICT.
    pixKey.state = KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED;

    // Update pixKey state
    await this.pixKeyRepository.update(pixKey);

    // Fire portability request confirm opened event.
    this.eventEmitter.portabilityRequestConfirmOpenedPixKey(pixKey, reason);

    this.logger.debug('Portability request confirm opened.', { pixKey });

    return pixKey;
  }
}
