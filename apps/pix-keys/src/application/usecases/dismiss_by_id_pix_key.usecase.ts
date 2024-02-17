import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';

export class DismissByIdPixKeyUseCase {
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
    this.logger = logger.child({ context: DismissByIdPixKeyUseCase.name });
  }

  /**
   * Dismiss the key by id.
   *
   * @param user Keys' owner.
   * @param id The key id
   * @returns Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   */
  async execute(user: User, id: string): Promise<PixKey> {
    // Data input check
    if (!user || !id) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    // Search pixKey
    const pixKey =
      await this.pixKeyRepository.getByUserAndIdAndStateIsNotCanceled(user, id);

    this.logger.debug('Found pix key.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    /**
     * If key state is:
     *   - NOT_CONFIRMED: key state will change to CANCELED.
     *   - OWNERSHIP_CONFLICT: key state will change to CANCELED.
     *   - CLAIM_NOT_CONFIRMED: key state will change to CLAIM_PENDING.
     *   - PORTABILITY_REQUEST_AUTO_CONFIRMED: key state will change to CANCELED.
     *   - PORTABILITY_CANCELED: key state will change to CANCELED.
     *   - OWNERSHIP_CANCELED: key state will change to CANCELED.
     *   - CLAIM_CLOSED: key state will change to CANCELED.
     *   - PORTABILITY_READY: key state will change to READY.
     *   - OWNERSHIP_READY: key state will change to READY.
     *   - ADD_KEY_READY: key state will change to READY.
     *   - DELETED: key state will change to CANCELED.
     */
    switch (pixKey.state) {
      case KeyState.CLAIM_NOT_CONFIRMED:
        pixKey.state = KeyState.CLAIM_PENDING;
        break;

      case KeyState.NOT_CONFIRMED:
      case KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED:
      case KeyState.PORTABILITY_CANCELED:
      case KeyState.OWNERSHIP_CANCELED:
      case KeyState.CLAIM_CLOSED:
      case KeyState.DELETED:
      case KeyState.OWNERSHIP_CONFLICT:
        pixKey.state = KeyState.CANCELED;
        pixKey.canceledAt = new Date();
        break;

      case KeyState.PORTABILITY_READY:
      case KeyState.OWNERSHIP_READY:
      case KeyState.ADD_KEY_READY:
        pixKey.state = KeyState.READY;
        break;

      default:
        throw new PixKeyInvalidStateException(pixKey);
    }

    // Update pixKey state
    await this.pixKeyRepository.update(pixKey);

    switch (pixKey.state) {
      case KeyState.CLAIM_PENDING:
        // Fire ClaimPendingPixKeyEvent
        this.eventEmitter.claimPendingPixKey(pixKey);
        break;
      case KeyState.READY:
        // Fire ReadyPixKeyEvent
        this.eventEmitter.readyPixKey(pixKey);
        break;
      case KeyState.CANCELED:
        // Fire CanceledPixKeyEvent
        this.eventEmitter.canceledPixKey(pixKey);
        break;
    }

    this.logger.debug('Dismissed pix key.', { pixKey });

    return pixKey;
  }
}
