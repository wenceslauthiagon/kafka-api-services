import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { PixKeyEventEmitter } from '@zro/pix-keys/application';

export class HandleClaimPendingExpiredPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleClaimPendingExpiredPixKeyUseCase.name,
    });
  }

  /**
   * Update claim pending key to claim closing.
   *
   * @param {UUID} id The key id
   * @param {ClaimReasonType} reason The claim reason.
   * @returns {PixKey} Key updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   */
  async execute(id: string, reason: ClaimReasonType): Promise<PixKey> {
    // Data input check
    if (!id || !reason) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!reason ? ['Reason'] : []),
      ]);
    }

    // Search pixKey
    const pixKey = await this.pixKeyRepository.getByIdAndStateIsNotCanceled(id);

    this.logger.debug('Found pix key.', { pixKey });

    // Indeponent retry
    if (!pixKey || pixKey.state !== KeyState.CLAIM_PENDING) {
      return pixKey;
    }

    // Update pixKey state
    pixKey.state = KeyState.CLAIM_CLOSING;
    await this.pixKeyRepository.update(pixKey);

    // Fire ClaimClosingPixKeyEvent
    this.eventEmitter.claimClosingPixKey(pixKey, reason);

    this.logger.debug('Pix key updated.', { pixKey });

    return pixKey;
  }
}
