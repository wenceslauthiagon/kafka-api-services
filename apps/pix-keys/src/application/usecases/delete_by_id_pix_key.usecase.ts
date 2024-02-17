import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  PixKeyReasonType,
  KeyState,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';

export class DeleteByIdPixKeyUseCase {
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
    this.logger = logger.child({ context: DeleteByIdPixKeyUseCase.name });
  }

  /**
   * Delete the key by id.
   *
   * @param {User} user Keys' owner.
   * @param {UUID} id The key id.
   * @param {PixKeyReasonType} reason The delete reason.
   * @returns {PixKey} Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   */
  async execute(
    user: User,
    id: string,
    reason: PixKeyReasonType,
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
      throw new PixKeyNotFoundException(pixKey);
    }

    // Check idempotency
    if (pixKey.state === KeyState.DELETING) {
      return pixKey;
    }

    // Try deleting ready and error state
    if (!pixKey.isReadyState() && pixKey.state !== KeyState.ERROR) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    pixKey.state = KeyState.DELETING;
    pixKey.deletedByReason = reason;
    // Update pixKey state
    await this.pixKeyRepository.update(pixKey);

    // Fire DeletingPixKeyEvent
    this.eventEmitter.deletingPixKey(pixKey);

    this.logger.debug('Deleted pix key.', { pixKey });

    return pixKey;
  }
}
