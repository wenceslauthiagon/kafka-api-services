import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import { PixKeyEventEmitter } from '@zro/pix-keys/application';

export class HandlePendingExpiredPixKeyUseCase {
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
      context: HandlePendingExpiredPixKeyUseCase.name,
    });
  }

  /**
   * Update pending key to canceled.
   *
   * @param id The key id
   * @returns Key updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   */
  async execute(id: string): Promise<PixKey> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search pixKey
    const pixKey = await this.pixKeyRepository.getByIdAndStateIsNotCanceled(id);

    this.logger.debug('Found pix key.', { pixKey });

    // Indeponent retry
    if (
      !pixKey ||
      pixKey.state !== KeyState.PENDING ||
      !pixKey.isCancelValidationType()
    ) {
      return pixKey;
    }

    // Update pixKey state
    pixKey.state = KeyState.CANCELED;
    pixKey.canceledAt = new Date();

    await this.pixKeyRepository.update(pixKey);

    // Fire CanceledPixKeyEvent
    this.eventEmitter.canceledPixKey(pixKey);

    this.logger.debug('Pix key updated.', { pixKey });

    return pixKey;
  }
}
