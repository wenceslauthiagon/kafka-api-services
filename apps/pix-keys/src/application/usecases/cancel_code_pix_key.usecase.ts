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
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyInvalidTypeException,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';

export class CancelCodePixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({ context: CancelCodePixKeyUseCase.name });
  }

  /**
   * Cancel pix key by user and id.
   *
   * @param user Keys' owner.
   * @param id The key id
   * @returns Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   * @throws {PixKeyInvalidTypeException} Thrown when key type is not valid.
   */
  async execute(
    user: User,
    id: string,
    reason: ClaimReasonType,
  ): Promise<PixKey> {
    // Data input check
    if (!user || !id) {
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

    // Indeponent retry
    if (KeyState.CLAIM_CLOSING === pixKey.state) {
      return pixKey;
    }

    // Sanity check.
    // Only EMAIL and PHONE keys can cancel validation.
    if (!pixKey.isCancelValidationType()) {
      throw new PixKeyInvalidTypeException(pixKey);
    }

    // Sanity check.
    // Only keys in PENDING or CLAIM_PENDING (claim process) states can be canceled
    if (!pixKey.isCancelValidationState()) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    switch (pixKey.state) {
      case KeyState.PENDING:
        pixKey.state = KeyState.CANCELED;
        pixKey.canceledAt = new Date();
        break;
      case KeyState.CLAIM_PENDING:
        pixKey.state = KeyState.CLAIM_CLOSING;
        break;
    }

    // Store new key state.
    await this.pixKeyRepository.update(pixKey);

    this.logger.debug('Pix key updated.', { pixKey });

    switch (pixKey.state) {
      case KeyState.CANCELED:
        // Send event for canceled.
        this.eventEmitter.canceledPixKey(pixKey);
        break;
      case KeyState.CLAIM_CLOSING:
        // Send event for claim closing.
        this.eventEmitter.claimClosingPixKey(pixKey, reason);
        break;
    }

    this.logger.debug('Pix key updated.', { pixKey });

    return pixKey;
  }
}
